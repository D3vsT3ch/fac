// server/server.js

import express from 'express';
import bodyParser from 'body-parser';
import amqp from 'amqplib';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Necesario para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/sendMessage', async (req, res) => {
  const data = req.body;

  try {
    // Conectar a RabbitMQ en Docker
    const connection = await amqp.connect('amqp://localhost:5672'); // Ajusta 'localhost' si es necesario
    const channel = await connection.createChannel();

    // Configurar exchange y cola
    const exchange = 'blockchain_data';
    const queue = 'blockchain_queue';
    const routingKey = 'blockchain.anotaciones'; // Ajusta según tus necesidades

    // Declarar exchange
    await channel.assertExchange(exchange, 'topic', { durable: true });

    // Declarar cola
    await channel.assertQueue(queue, { durable: true });

    // Vincular cola al exchange
    await channel.bindQueue(queue, exchange, routingKey);

    // Publicar mensaje
    const message = JSON.stringify(data);
    channel.publish(exchange, routingKey, Buffer.from(message), {
      persistent: true, // Marca el mensaje como persistente
    });

    console.log(`Mensaje enviado a la cola '${queue}' con routing key '${routingKey}': ${message}`);

    // Cerrar conexión después de un tiempo
    setTimeout(() => {
      connection.close();
    }, 500);

    res.status(200).json({ message: 'Mensaje enviado a RabbitMQ' });
  } catch (error) {
    console.error('Error al enviar el mensaje a RabbitMQ:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje a RabbitMQ' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en el puerto ${port}`);
});
