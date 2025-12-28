const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL2,
      private_key: process.env.GOOGLE_PRIVATE_KEY2.replace(/\\n/g, "\n"),
    },
    projectId: process.env.GOOGLE_PROJECT_ID2,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

// GET - Eventos
router.get("/eventos", async (req, res) => {
  try {
    const auth = await getAuth().getClient();
    const calendar = google.calendar({ version: "v3", auth });

    const resp = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID2,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(resp.data.items);
  } catch (e) {
    console.error("GET Error:", e);
    res.status(500).send("Error obteniendo eventos");
  }
});

// POST - Crear evento COMPLETO
router.post("/eventos", async (req, res) => {
  try {
    const { title, description, start, end, invitados, ubicacion, meet } =
      req.body;

    const auth = await getAuth().getClient();
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: title,
      description,
      location: ubicacion || "",
      attendees: invitados?.map((email) => ({ email })) || [],
      start: { dateTime: start, timeZone: "America/Bogota" },
      end: { dateTime: end, timeZone: "America/Bogota" },
      conferenceData: meet
        ? {
            createRequest: { requestId: new Date().getTime().toString() },
          }
        : undefined,
    };

    const resp = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID2,
      resource: event,
      conferenceDataVersion: 1,
    });

    res.json(resp.data);
  } catch (e) {
    console.error("POST Error:", e);
    res.status(500).send("Error creando evento");
  }
});

// DELETE - Eliminar
router.delete("/eventos/:id", async (req, res) => {
  try {
    const auth = await getAuth().getClient();
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID2,
      eventId: req.params.id,
    });

    res.json({ success: true });
  } catch (e) {
    console.error("DELETE Error:", e);
    res.status(500).send("Error eliminando evento");
  }
});

module.exports = router;
