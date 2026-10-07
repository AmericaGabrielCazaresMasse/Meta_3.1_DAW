/**
 * Controlador de Tareas
 * Maneja las peticiones HTTP y responde con JSON
 */

import * as tareaModel from '../models/tarea.model.js';

// Valida los campos titulo y completada. Devuelve un mensaje de error o null
const validarCampos = ({ titulo, completada }) => {
  if (titulo !== undefined && (typeof titulo !== 'string' || !titulo.trim())) {
    return 'El campo "titulo" debe ser un texto no vacío';
  }
  if (completada !== undefined && typeof completada !== 'boolean') {
    return 'El campo "completada" debe ser booleano (true o false)';
  }
  return null;
};

// GET /api/tareas - Obtener todas las tareas
const obtenerTodas = (req, res) => {
  try {
    const tareas = tareaModel.obtenerTodas();
    const { formato = 'json' } = req.query;

    if (formato === 'text') {
      const texto = tareas
        .map(t => `${t.id}. [${t.completada ? 'x' : ' '}] ${t.titulo}`)
        .join('\n');
      return res.type('text/plain').send(texto);
    }

    res.json({ success: true, data: tareas, count: tareas.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tareas',
      error: error.message
    });
  }
};

// GET /api/tareas/buscar?q=texto - Buscar tareas por título
const buscar = (req, res) => {
  try {
    const { q } = req.query;

    if (typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "q" es requerido'
      });
    }

    const resultados = tareaModel.buscarPorTitulo(q.trim());
    res.json({ success: true, data: resultados, count: resultados.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar las tareas',
      error: error.message
    });
  }
};

// GET /api/tareas/:id - Obtener una tarea por ID
const obtenerPorId = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Debe ser un número'
      });
    }

    const tarea = tareaModel.obtenerPorId(id);

    if (!tarea) {
      return res.status(404).json({
        success: false,
        message: `Tarea con ID ${id} no encontrada`
      });
    }

    res.json({
      success: true,
      data: tarea
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la tarea',
      error: error.message
    });
  }
};

// POST /api/tareas - Crear una nueva tarea
const crear = (req, res) => {
  try {
    const { titulo, completada } = req.body ?? {};

    if (titulo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo "titulo" es requerido'
      });
    }

    const errorValidacion = validarCampos({ titulo, completada });
    if (errorValidacion) {
      return res.status(400).json({
        success: false,
        message: errorValidacion
      });
    }

    const nuevaTarea = tareaModel.crear({ titulo: titulo.trim(), completada });

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: nuevaTarea
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear la tarea',
      error: error.message
    });
  }
};

// PUT /api/tareas/:id - Actualizar tarea completamente
const actualizarCompleta = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, completada } = req.body ?? {};

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Debe ser un número'
      });
    }

    if (titulo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo "titulo" es requerido'
      });
    }

    const errorValidacion = validarCampos({ titulo, completada });
    if (errorValidacion) {
      return res.status(400).json({
        success: false,
        message: errorValidacion
      });
    }

    const tareaActualizada = tareaModel.actualizarCompleta(id, {
      titulo: titulo.trim(),
      completada
    });

    if (!tareaActualizada) {
      return res.status(404).json({
        success: false,
        message: `Tarea con ID ${id} no encontrada`
      });
    }

    res.json({
      success: true,
      message: 'Tarea actualizada completamente',
      data: tareaActualizada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la tarea',
      error: error.message
    });
  }
};

// PATCH /api/tareas/:id - Actualizar tarea parcialmente
const actualizarParcial = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, completada } = req.body ?? {};

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Debe ser un número'
      });
    }

    const datosParciales = {};
    if (titulo !== undefined) datosParciales.titulo = titulo;
    if (completada !== undefined) datosParciales.completada = completada;

    if (Object.keys(datosParciales).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar al menos un campo para actualizar (titulo o completada)'
      });
    }

    const errorValidacion = validarCampos(datosParciales);
    if (errorValidacion) {
      return res.status(400).json({
        success: false,
        message: errorValidacion
      });
    }

    if (datosParciales.titulo !== undefined) {
      datosParciales.titulo = datosParciales.titulo.trim();
    }

    const tareaActualizada = tareaModel.actualizarParcial(id, datosParciales);

    if (!tareaActualizada) {
      return res.status(404).json({
        success: false,
        message: `Tarea con ID ${id} no encontrada`
      });
    }

    res.json({
      success: true,
      message: 'Tarea actualizada parcialmente',
      data: tareaActualizada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la tarea',
      error: error.message
    });
  }
};

// DELETE /api/tareas/:id - Eliminar una tarea
const eliminar = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Debe ser un número'
      });
    }

    const tareaEliminada = tareaModel.eliminar(id);

    if (!tareaEliminada) {
      return res.status(404).json({
        success: false,
        message: `Tarea con ID ${id} no encontrada`
      });
    }

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente',
      data: tareaEliminada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la tarea',
      error: error.message
    });
  }
};

// Exportar todos los métodos del controlador
export {
  obtenerTodas,
  buscar,
  obtenerPorId,
  crear,
  actualizarCompleta,
  actualizarParcial,
  eliminar
};