FROM mongo:latest

COPY /imports .

CMD mongoimport --uri mongodb://mongo:27017/barbak --collection categorical-data --type json --jsonArray --file imports/categorical-data.json && exit