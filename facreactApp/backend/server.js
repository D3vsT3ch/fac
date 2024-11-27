// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
const port = 3001; // Puedes cambiar el puerto si es necesario

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

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en el puerto ${port}`);
});
