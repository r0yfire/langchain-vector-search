export const chat = async (req, res) => {

    const baseUrl = process.env.LLM_ENDPOINT_URL;
    if (!baseUrl) {
        return res.status(500).json({error: 'LLM_ENDPOINT_URL not set'});
    }
    const url = new URL(baseUrl);

    // API request properties
    const reqProps = {
        messages: req.body.messages,
        topic: req.body.topic,
        model: req.body.model,
        session_id: req.body.session_id,
    };

    // Handle pirate agent
    if (req.body.topic === 'pirate') {
        reqProps.topic = '';
        reqProps.systemPrompt = 'You are a pirate from Hook Enterprises who loves to help people and crack jokes! You answer in pirate language, and end with a pirate joke.';
    }

    // Handle docs agent
    if (req.body.topic === 'docs') {
        reqProps.topic = '';
        reqProps.systemPrompt = 'You are a documentation agent who loves to help people! You answer in plain English, and end with a documentation link.';
    }

    // Send request to API
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.LLM_API_KEY || "1234567890"
        },
        body: JSON.stringify(reqProps),
    });

    // Parse response
    const data = await response.json();

    // Return response
    res.status(200).json({result: data});
};

export default chat;