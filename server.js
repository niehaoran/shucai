const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/market', async (req, res) => {
    try {
        const response = await axios.get('http://sc.cqnync.cn/marketSta/?vexp=2&classId=2', {
            headers: {
                'Upgrade-Insecure-Requests': '1',
                'Cookie': 'seed=f4d56f33-0c53-4ed7-ac55-bcdf923b64fb',
                'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
                'Accept': '*/*',
                'Host': 'sc.cqnync.cn',
                'Connection': 'keep-alive'
            }
        });

        // 使用 cheerio 解析 HTML
        const $ = cheerio.load(response.data);
        const vegetableData = [];

        // 遍历表格行，提取蔬菜名称和价格
        $('#ctl00_list__list tbody tr').each((index, element) => {
            const variety = $(element).find('.variety').text().trim();
            const pricePerKg = parseFloat($(element).find('.price').text().trim());
            const market = $(element).find('.market').text().trim();
            const date = $(element).find('.gatherTime').text().trim();

            // 只获取重庆双福国际农贸城的数据
            if (market === "重庆双福国际农贸城" && variety && !isNaN(pricePerKg)) {
                vegetableData.push({
                    variety,
                    pricePerKg: pricePerKg.toFixed(2), // 每公斤的价格
                    pricePerJin: (pricePerKg / 2).toFixed(2), // 每斤的价格
                    market,
                    date,
                });
            }
        });

        res.json(vegetableData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
