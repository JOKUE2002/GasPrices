const fetch = require('sync-fetch')
const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public/"));

app.get('/adac', (req, res) => {
    const paramsS = {
        Sorte: 'Super',
        UmkreisKm: 10,
        PageSize: 100,
        PageNumber: 1,
        SortiereNach: 'Preis',
        SortierRichtung: 'asc'
    }
    
    const dataS = fetch('https://apim-p-gw02.adac.de/spritpreise/liste/53.7636537/9.9867244?' + new URLSearchParams(paramsS), {
        headers: {'ocp-apim-subscription-key': 'e9216740d3b64ae0bdaf6cff961afc1b'}
    }).json()

    const paramsD = {
        Sorte: 'Diesel',
        UmkreisKm: 10,
        PageSize: 100,
        PageNumber: 1,
        SortiereNach: 'Preis',
        SortierRichtung: 'asc'
    }
    
    const dataD = fetch('https://apim-p-gw02.adac.de/spritpreise/liste/53.7636537/9.9867244?' + new URLSearchParams(paramsD), {
        headers: {'ocp-apim-subscription-key': 'e9216740d3b64ae0bdaf6cff961afc1b'}
    }).json()

    const tmp = [];

    dataD.Data.Tankstellen.forEach(e => {
        const superData = dataS.Data.Tankstellen.find(e2 => e2.PoiId == e.PoiId)

        const prices = [
            {
                type: 'Diesel',
                price: e.Preis
            }
        ]

        if (superData) {
            prices.push({
                type: 'Super',
                price: superData.Preis
            })
        }

        tmp.push({
            tankstelle: {
                name: e.Name,
                street: e.Strasse,
                postal: e.Plz,
                city: e.Ort
            },
            prices: prices,
            lastChange: e.Datum + ' ' + e.TimeSort
        })
    });

    res.send(tmp);
});

//3 Diesel
//7 Super E5
//6 SuperPlus
app.get('/clevertanken', (req, res) => {
    res.sendFile(__dirname + '/dummyData.json');
    return;

    const dataD = fetch(`https://www.clever-tanken.de/tankstelle_liste?lat=${req.query.lat}&lon=${req.query.lon}&ort=&spritsorte=3&r=10&sort=p`).text().split('\n').map(e => e.trim()).filter(e => e != '');

    const valuesD = dataD.filter(e => ((e.includes('<sup>') && !e.includes('city-price-average-text')) || (e.includes('price-changed') && !e.includes('<br>')) || (e.includes('fuel-station-location') && (e.includes('name') || e.includes('street') || e.includes('city')) && !e.includes('icon')) || e.includes('/tankstelle_details')))

    const tmp = [];
    for (let i = 0; i < valuesD.length; i += 6) {
        const id = valuesD[i].split('/tankstelle_details/')[1].split('"')[0];
        const price = valuesD[i + 1].replace('<sup>', '').replace('</sup>', '').trim();
        const change = valuesD[i + 2].split('>')[1].trim();
        const name = valuesD[i + 3].split('>')[1].split('<')[0].trim();
        const street = valuesD[i + 4].split('>')[1].split('<')[0].trim();
        const city = valuesD[i + 5].split('>')[1].split('<')[0].trim();

        tmp.push({
            tankstelle: {
                id: id,
                name: name,
                street: street,
                postal: '',
                city: city
            }, prices: [
                {
                    type: 'Diesel',
                    price: price
                }
            ],
            lastChange: change
        });
    }

    const dataS = fetch(`https://www.clever-tanken.de/tankstelle_liste?lat=${req.query.lat}&lon=${req.query.lon}&ort=&spritsorte=7&r=10&sort=p`).text().split('\n').map(e => e.trim()).filter(e => e != '');

    const valuesS = dataS.filter(e => ((e.includes('<sup>') && !e.includes('city-price-average-text')) || (e.includes('price-changed') && !e.includes('<br>')) || (e.includes('fuel-station-location') && (e.includes('name') || e.includes('street') || e.includes('city')) && !e.includes('icon')) || e.includes('/tankstelle_details')))

    for (let i = 0; i < valuesS.length; i += 6) {
        const id = valuesS[i].split('/tankstelle_details/')[1].split('"')[0];
        const price = valuesS[i + 1].replace('<sup>', '').replace('</sup>', '').trim();
        const change = valuesS[i + 2].split('>')[1].trim();
        const name = valuesS[i + 3].split('>')[1].split('<')[0].trim();
        const street = valuesS[i + 4].split('>')[1].split('<')[0].trim();
        const city = valuesS[i + 5].split('>')[1].split('<')[0].trim();

        const idx = tmp.findIndex(e => e.tankstelle.id == id);
        if (idx > -1) {
            tmp[idx].prices.push({
                type: 'Super',
                price: price
            });
        } else {
            tmp.push({
                tankstelle: {
                    id: id,
                    name: name,
                    street: street,
                    postal: '',
                    city: city
                }, prices: [
                    {
                        type: 'Super',
                        price: price
                    }
                ],
                lastChange: change
            });
        }
    }

    const dataSP = fetch(`https://www.clever-tanken.de/tankstelle_liste?lat=${req.query.lat}&lon=${req.query.lon}&ort=&spritsorte=6&r=10&sort=p`).text().split('\n').map(e => e.trim()).filter(e => e != '');

    const valuesSP = dataSP.filter(e => ((e.includes('<sup>') && !e.includes('city-price-average-text')) || (e.includes('price-changed') && !e.includes('<br>')) || (e.includes('fuel-station-location') && (e.includes('name') || e.includes('street') || e.includes('city')) && !e.includes('icon')) || e.includes('/tankstelle_details')))

    for (let i = 0; i < valuesSP.length; i += 6) {
        const id = valuesSP[i].split('/tankstelle_details/')[1].split('"')[0];
        const price = valuesSP[i + 1].replace('<sup>', '').replace('</sup>', '').trim();
        const change = valuesSP[i + 2].split('>')[1].trim();
        const name = valuesSP[i + 3].split('>')[1].split('<')[0].trim();
        const street = valuesSP[i + 4].split('>')[1].split('<')[0].trim();
        const city = valuesSP[i + 5].split('>')[1].split('<')[0].trim();

        const idx = tmp.findIndex(e => e.tankstelle.id == id);
        if (idx > -1) {
            tmp[idx].prices.push({
                type: 'Super Plus',
                price: price
            });
        } else {
            tmp.push({
                tankstelle: {
                    id: id,
                    name: name,
                    street: street,
                    postal: '',
                    city: city
                }, prices: [
                    {
                        type: 'Super Plus',
                        price: price
                    }
                ],
                lastChange: change
            });
        }
    }

    // 1.53<sup>9</sup>
    // <span class="price-changed">vor 2 Std.
    // <span class="fuel-station-location-name">Hoyer</span>
    // <div class="fuel-station-location-street">Max-Weber-Str. 10</div>
    // <div class="fuel-station-location-city"> 25451 Quickborn</div>
    //console.log(data);

    res.send(tmp);
});


const ctTankstellenIds = [148933, 7932, 5837, 5525, 12636, 5527, 1615, 1614, 22665, 4637, 11298, 99124, 4345, 10082, 9832, 2330, 46720, 11486, 9231, 2329, 9314, 4589, 23114, 14922, 5836];
app.get('/legacy-clevertanken', (req, res) => {
    const tmp = [];

    ctTankstellenIds.forEach(id => {
        const data = fetch(`https://www.clever-tanken.de/tankstelle_details/${id}`).text()

        const lines = data.split('\n');

        const addressLines = lines.filter(e => e.includes('itemprop') && !e.includes('itemscope')).map(e => e.trim()).map(e => e.replace(/<.*?>/g, ''));
        const priceLines = lines.filter(e => e.includes('price-type-name') || e.includes('current-price')).map(e => e.trim()).map(e => e.replace(/<.*?>/g, ''));
        const lastChange = lines.filter(e => e.includes('Letzte Aktualisierung')).map(e => e.trim()).map(e => e.replace(/<.*?>/g, ''));

        const prices = []

        for (let i = 0; i < priceLines.length; i += 2) {
            const type = priceLines[i];
            const price = priceLines[i + 1];
            
            prices.push({type: type, price: Number(price) + 0.009});
        }

        tmp.push({
            tankstelle: {
                name: addressLines[0],
                street: addressLines[1],
                postal: addressLines[2],
                city: addressLines[3],
            },
            prices: prices,
            lastChange: lastChange[0].split(': ')[1]
        });
    });

    tmp.sort((a, b) => (a.prices.find(ap => ap.type == 'Diesel').price ?? 99) < (b.prices.find(bp => bp.type == 'Diesel').price ?? 99))

    res.send(tmp);
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
  
app.listen(process.env.PORT ?? 3000);