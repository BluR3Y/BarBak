const express = require('express');
const app = express();

const { PORT } = process.env;
console.log(PORT)

app.post('/testpostreq', (req,res) => {
    res.status(200).send("Hello There From API");
})

app.get('/testgetreq', (req,res) => {
    res.status(200).send("Hello There From API");
})

app.get('/', (req,res) => {
    res.send("Hello There From API");
})

app.listen(PORT, () => console.log(`API is listening on http://localhost:${PORT}`));