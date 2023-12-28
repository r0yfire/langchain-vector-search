import React, {useState, useRef, useEffect} from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import PersonIcon from '@mui/icons-material/Person';
import AndroidIcon from '@mui/icons-material/Android';
import styles from '../src/styles/Home.module.css';
import TopNavBar from '../src/components/TopNavBar';
import {uuid} from '../src/libs/utils';
import {createCookie, readCookie} from '../src/libs/cookies';

const FirstMessages = [
    {
        "content": "Hi there! How can I help?",
        "role": "assistant"
    },
];

export default function Home() {

    const [userInput, setUserInput] = useState("");
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState(FirstMessages);
    const [agent, setAgent] = useState("docs");
    const [model, setModel] = useState("gpt-3.5-turbo-1106");
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const messageListRef = useRef(null);
    const textAreaRef = useRef(null);

    // Auto scroll chat to bottom
    useEffect(() => {
        const messageList = messageListRef.current;
        messageList.scrollTop = messageList.scrollHeight;
    }, [messages]);

    // Focus on text field on load
    useEffect(() => {
        textAreaRef.current.focus();

        // Check if user has a cookie
        const sessionId = readCookie('autohost_chat_session_id');

        // If not, create one
        if (!sessionId) {
            createCookie('autohost_chat_session_id', uuid(), 'Thu, 01 Jan 2030 00:00:00 UTC');
        }
    }, []);

    const resetSession = () => {
        setMessages(FirstMessages);
        setHistory([]);
        createCookie('autohost_chat_session_id', uuid(), 'Thu, 01 Jan 2030 00:00:00 UTC');
        setSnackbarMessage("Session history cleared");
    };

    // Handle errors
    const handleError = () => {
        setMessages((prevMessages) => [...prevMessages, {
            "content": "Oops! There seems to be an error. Please try again.",
            "role": "assistant"
        }]);
        setLoading(false);
        setUserInput("");
    };

    const handleChangeAgent = (agent) => {
        setAgent(agent);
        setMessages(FirstMessages);
        setHistory([]);
        setSnackbarMessage(`Agent changed to ${agent}`);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (userInput.trim() === "") {
            return;
        }

        setLoading(true);
        setMessages((prevMessages) => [...prevMessages, {"content": userInput, "role": "user"}]);

        // Set API endpoint URL
        const url = process.env.NEXT_PUBLIC_LLM_ENDPOINT_URL || '/api/chat';

        // Send request to API
        let result;
        try {
            result = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Origin": window.location.origin,
                },
                body: JSON.stringify({
                    question: userInput,
                    session_id: readCookie('autohost_chat_session_id'),
                    agent_type: agent,
                    topic: agent,
                    model: model,
                    messages: [
                        ...messages,
                        {
                            "content": userInput.trim(),
                            "role": "user"
                        }
                    ]
                }),
            });
        } catch (error) {
            handleError();
            return;
        }

        // Parse response
        const data = await result.json();
        const response = (data || {}).result || data;

        // Reset user input
        setUserInput("");

        // Handle errors
        if (response && response.error) {
            handleError();
            return;
        }

        // Display response
        setMessages((prevMessages) => [...prevMessages, {"content": response.text, "role": "assistant"}]);

        // Turn off loading indicator
        setLoading(false);
    };

    // Prevent blank submissions and allow for multiline input
    const handleEnter = (e) => {
        if (e.key === "Enter" && userInput) {
            if (!e.shiftKey && userInput) {
                handleSubmit(e);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    // Keep history in sync with messages
    useEffect(() => {
        if (messages.length >= 3) {
            setHistory([[messages[messages.length - 2].content, messages[messages.length - 1].content]]);
        }
    }, [messages]);

    return (
        <>
            <Head>
                <title>Autohost Chat</title>
                <meta name="description" content="Autohost documentation chatbot"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon_192x192.png" sizes="192x192" type="image/png"/>
            </Head>
            <TopNavBar
                resetSession={resetSession}
                setAgent={handleChangeAgent}
                agent={agent}
                setModel={setModel}
                model={model}
            />
            <main className={styles.main}>
                <div className={styles.cloud}>
                    <div ref={messageListRef} className={styles.messagelist}>
                        {messages.map((message, index) => {
                            return (
                                // The latest message sent by the user will be animated while waiting for a response
                                <div
                                    key={index}
                                    className={
                                        message.role === "user" && loading && index === messages.length - 1 ?
                                            styles.usermessagewaiting :
                                            message.role === "assistant" ?
                                                styles.apimessage :
                                                styles.usermessage
                                    }
                                >
                                    {/* Display the correct icon depending on the message type */}
                                    {message.role === "assistant" ?
                                        <AndroidIcon className={styles.boticon}/> :
                                        <PersonIcon className={styles.usericon}/>}
                                    <div className={styles.markdownanswer}>
                                        {/* Messages are being rendered in Markdown format */}
                                        <ReactMarkdown
                                            linkTarget="_blank"
                                            remarkPlugins={[gfm]}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.center}>

                    <div className={styles.cloudform}>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                disabled={loading}
                                onKeyDown={handleEnter}
                                ref={textAreaRef}
                                autoFocus={false}
                                rows={3}
                                type="text"
                                id="userInput"
                                name="userInput"
                                placeholder={loading ? "Waiting for response..." : "Type your question..."}
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                className={styles.textarea}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.generatebutton}
                            >
                                {loading ?
                                    <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20}/>
                                    </div> :
                                    // Send icon SVG in input field
                                    <svg
                                        viewBox="0 0 20 20"
                                        className={styles.svgicon}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                                        />
                                    </svg>}
                            </button>
                        </form>
                    </div>

                    <div className={styles.footer}>
                        <p style={{textAlign: 'center'}}>
                            &copy; Firestein {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </main>
            <Snackbar
                open={Boolean(snackbarMessage && snackbarMessage.length > 1)}
                autoHideDuration={6000}
                onClose={() => setSnackbarMessage("")}
                message={snackbarMessage}
            />
        </>
    );
}