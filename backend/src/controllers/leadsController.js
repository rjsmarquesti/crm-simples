const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { dispararWebhook } = require('../services/webhook');

const CAMPOS_ENDERECO = [
  'cep','logradouro','numero','complemento','bairro','cidade','municipio','estado',
];

const CAMPOS_MAPS = [
  'nicho','categoria','subcategoria','googleMapsUrl','placeId',
  'rating','reviewsCount','website',
];

const CAMPOS_FUNIL = ['ultimoContato','proximoContato'];

function extrairCampos(body, lista) {
  return Object.fromEntries(
    lista.map(k => [k, body[k] !== undefined ? body[k] || null : undefined])
        .filter(([, v]) => v !== undefined)
  );
}

// GET /leads — listar com filtros geográficos, nicho, fonte, status
exports.listar = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      busca, status, fonte, priority,
      estado, municipio, cidade, bairro,
      nicho, categoria,
      page = 1, limit = 50,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where = { tenantId };

    if (status)    where.status    = status;
    if (fonte)     where.fonte     = fonte;
    if (priority)  where.priority  = priority;
    if (estado)    where.estado    = estado;
    if (municipio) where.municipio = { contains: municipio };
    if (cidade)    where.cidade    = { contains: cidade };
    if (bairro)    where.bairro    = { contains: bairro };
    if (nicho)     where.nicho     = nicho;
    if (categoria) where.categoria = categoria;

    if (busca) {
      where.OR = [
        { nome:     { contains: busca } },
        { telefone: { contains: busca } },
        { email:    { contains: busca } },
        { nicho:    { contains: busca } },
        { bairro:   { contains: busca } },
        { cidade:   { contains: busca } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// GET /leads/nichos — lista nichos e categorias disponíveis no tenant
exports.nichos = async (req, res, next) => {
  try {
    const raw = await prisma.lead.findMany({
      where: { tenantId: req.user.tenantId, nicho: { not: null } },
      select: { nicho: true, categoria: true },
      distinct: ['nicho', 'categoria'],
      orderBy: { nicho: 'asc' },
    });

    const mapa = {};
    raw.forEach(({ nicho, categoria }) => {
      if (!nicho) return;
      if (!mapa[nicho]) mapa[nicho] = new Set();
      if (categoria) mapa[nicho].add(categoria);
    });

    const data = Object.entries(mapa).map(([nicho, cats]) => ({
      nicho,
      categorias: Array.from(cats).sort(),
    }));

    res.json({ data });
  } catch (err) { next(err); }
};

// GET /leads/stats — contagens rápidas para o dashboard
exports.stats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const [total, byStatus, byFonte, byNicho] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.lead.groupBy({ by: ['fonte'],  where: { tenantId }, _count: true }),
      prisma.lead.groupBy({
        by: ['nicho'], where: { tenantId, nicho: { not: null } },
        _count: true, orderBy: { _count: { nicho: 'desc' } }, take: 10,
      }),
    ]);
    res.json({ total, byStatus, byFonte, byNicho });
  } catch (err) { next(err); }
};

// GET /leads/:id
exports.buscarPorId = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), tenantId: req.user.tenantId },
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json({ lead });
  } catch (err) { next(err); }
};

// POST /leads — criar lead único
exports.criar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, telefone, telefone2, email, website, origem, status, priority, fonte, observacoes } = req.body;

    const lead = await prisma.lead.create({
      data: {
        tenantId: req.user.tenantId,
        nome,
        telefone:  telefone  || null,
        telefone2: telefone2 || null,
        email:     email     || null,
        website:   website   || null,
        origem:    origem    || null,
        status:    status    || 'novo',
        priority:  priority  || 'normal',
        fonte:     fonte     || 'manual',
        observacoes: observacoes || null,
        ...extrairCampos(req.body, CAMPOS_ENDERECO),
        ...extrairCampos(req.body, CAMPOS_MAPS),
        ...extrairCampos(req.body, CAMPOS_FUNIL),
      },
    });

    dispararWebhook(req.user.tenantId, 'lead.criado', lead);
    res.status(201).json({ lead });
  } catch (err) {
    // Duplicata place_id no mesmo tenant
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Este estabelecimento já está cadastrado (place_id duplicado)' });
    }
    next(err);
  }
};

// POST /leads/importar — importação em lote (Google Maps)
exports.importar = async (req, res, next) => {
  try {
    const { leads: lista } = req.body;
    if (!Array.isArray(lista) || lista.length === 0) {
      return res.status(400).json({ error: 'Envie um array "leads" com pelo menos 1 item' });
    }
    if (lista.length > 500) {
      return res.status(400).json({ error: 'Máximo de 500 leads por importação' });
    }

    const tenantId = req.user.tenantId;
    let inseridos = 0;
    let ignorados = 0;
    const erros = [];

    for (const item of lista) {
      if (!item.nome || !item.estado || !item.nicho) {
        erros.push({ item: item.nome || '?', erro: 'nome, estado e nicho são obrigatórios' });
        continue;
      }
      try {
        await prisma.lead.create({
          data: {
            tenantId,
            nome:          item.nome,
            telefone:      item.telefone      || null,
            telefone2:     item.telefone2     || null,
            email:         item.email         || null,
            website:       item.website       || null,
            origem:        item.origem        || 'Google Maps',
            status:        item.status        || 'novo',
            priority:      item.priority      || 'normal',
            fonte:         item.fonte         || 'google_maps',
            observacoes:   item.observacoes   || null,
            cep:           item.cep           || null,
            logradouro:    item.logradouro     || null,
            numero:        item.numero        || null,
            complemento:   item.complemento   || null,
            bairro:        item.bairro        || null,
            cidade:        item.cidade        || null,
            municipio:     item.municipio     || null,
            estado:        item.estado?.toUpperCase().slice(0, 2) || null,
            nicho:         item.nicho         || null,
            categoria:     item.categoria     || null,
            subcategoria:  item.subcategoria  || null,
            googleMapsUrl: item.googleMapsUrl || item.google_maps_url || null,
            placeId:       item.placeId       || item.place_id       || null,
            rating:        item.rating        ? Number(item.rating)  : null,
            reviewsCount:  item.reviewsCount  ? Number(item.reviewsCount) : 0,
          },
        });
        inseridos++;
      } catch (e) {
        if (e.code === 'P2002') { ignorados++; } // duplicata
        else erros.push({ item: item.nome, erro: e.message });
      }
    }

    res.json({ ok: true, inseridos, ignorados, erros });
  } catch (err) { next(err); }
};

// PUT /leads/:id — atualizar
exports.atualizar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const existe = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), tenantId: req.user.tenantId },
    });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });

    const { nome, telefone, telefone2, email, website, origem, status, priority, fonte, observacoes } = req.body;

    const lead = await prisma.lead.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        telefone:    telefone    ?? existe.telefone,
        telefone2:   telefone2   ?? existe.telefone2,
        email:       email       ?? existe.email,
        website:     website     ?? existe.website,
        origem:      origem      ?? existe.origem,
        status:      status      ?? existe.status,
        priority:    priority    ?? existe.priority,
        fonte:       fonte       ?? existe.fonte,
        observacoes: observacoes ?? existe.observacoes,
        ...extrairCampos(req.body, CAMPOS_ENDERECO),
        ...extrairCampos(req.body, CAMPOS_MAPS),
        ...extrairCampos(req.body, CAMPOS_FUNIL),
      },
    });

    const evento = existe.status !== status ? 'lead.status_alterado' : 'lead.atualizado';
    dispararWebhook(req.user.tenantId, evento, lead);
    res.json({ lead });
  } catch (err) { next(err); }
};

// DELETE /leads/:id
exports.deletar = async (req, res, next) => {
  try {
    const existe = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), tenantId: req.user.tenantId },
    });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });

    await prisma.lead.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Lead removido' });
  } catch (err) { next(err); }
};
