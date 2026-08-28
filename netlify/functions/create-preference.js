const https = require("https");

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { items } = JSON.parse(event.body);
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    const preference = {
        items: items.map(item => ({
            title: item.name,
            quantity: item.quantity || 1,
            unit_price: item.price,
            currency_id: "ARS",
        })),
        back_urls: {
            success: "https://ubplast.netlify.app/?pago=exitoso",
            failure: "https://ubplast.netlify.app/?pago=fallido",
            pending: "https://ubplast.netlify.app/?pago=pendiente",
        },
        auto_return: "approved",
        statement_descriptor: "UB PLAST",
        payment_methods: {
            installments: 12,
        },
    };

    return new Promise((resolve) => {
        const data = JSON.stringify(preference);
        const options = {
            hostname: "api.mercadopago.com",
            path: "/checkout/preferences",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
        };

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", chunk => (body += chunk));
            res.on("end", () => {
                const parsed = JSON.parse(body);
                resolve({
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ init_point: parsed.init_point }),
                });
            });
        });

        req.on("error", (e) => {
            resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
        });

        req.write(data);
        req.end();
    });
};