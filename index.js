const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.my6ni.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect()

async function run (){
    try{
        await client.connect();
        const partsCollection = client.db('moto_gears').collection('parts');

        app.get('/parts', async(req, res)=>{
                        const query = {};
                        const cursor = partsCollection.find(query)
                        const services = await cursor.toArray();
                        res.send(services)
                    });

        app.get('/parts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const item = await partsCollection.findOne(query);
            res.send(item)
          });           
    }

    finally{

    }
};
run().catch(console.dir)

app.get('/', (req, res)=> {
    res.send('Hello from moto gears')
});

app.listen(port, ()=>  {
    console.log(`moto gears app listening port ${port}`);
})