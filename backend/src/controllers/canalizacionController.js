// src/controllers/canalizacionController.js
import { Canalizacion, Alumno, User } from "../models/index.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

export const crearCanalizacion = async (req, res) => {
  try {
    const canalizacion = await Canalizacion.create(req.body);
    res.status(201).json({ message: "Canalización registrada", canalizacion });
  } catch (error) {
    res.status(500).json({ message: "Error al crear canalización", error });
  }
};

export const obtenerCanalizaciones = async (req, res) => {
  try {
    const canalizaciones = await Canalizacion.findAll({
      include: [
        { model: Alumno, as: "alumno" },
        { model: User, as: "tutor" },
      ],
    });
    res.json(canalizaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener canalizaciones", error });
  }
};

// 📹 Generar reporte PDF
export const generarReportePDF = async (req, res) => {
  try {
    const canalizaciones = await Canalizacion.findAll({
      include: [{ model: Alumno, as: "alumno" }],
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=canalizaciones.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Canalizaciones", { align: "center" });
    doc.moveDown();

    canalizaciones.forEach((c, i) => {
      doc.fontSize(12).text(
        `${i + 1}. Alumno: ${c.alumno?.Nombre || "N/A"} | Área: ${c.area_destino} | Motivo: ${c.motivo}`
      );
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error al generar PDF", error });
  }
};

// 📹 Generar reporte Excel
export const generarReporteExcel = async (req, res) => {
  try {
    const canalizaciones = await Canalizacion.findAll({
      include: [{ model: Alumno, as: "alumno" }],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Canalizaciones");

    sheet.columns = [
      { header: "Alumno", key: "alumno", width: 25 },
      { header: "Área destino", key: "area_destino", width: 20 },
      { header: "Motivo", key: "motivo", width: 30 },
      { header: "Fecha", key: "createdAt", width: 15 },
    ];

    canalizaciones.forEach((c) => {
      sheet.addRow({
        alumno: c.alumno?.Nombre || "N/A",
        area_destino: c.area_destino,
        motivo: c.motivo,
        createdAt: new Date(c.createdAt).toLocaleDateString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=canalizaciones.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: "Error al generar Excel", error });
  }
};