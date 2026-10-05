const form =
    document.getElementById("chat-form");

const input =
    document.getElementById("text-input");

const sendButton =
    document.getElementById("send-button");

const conversation =
    document.getElementById("conversation");

const status =
    document.getElementById("status");

const ring =
    document.getElementById("status-ring");

const processing =
    document.getElementById("processing");

const SESSION_ID =
    crypto.randomUUID();

const LUCY_CLOUD_URL =
    "https://lucy-cloud.onrender.com/chat";


function getTime() {
    const now =
        new Date();

    return now.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );
}


function addMessage(
    message,
    type
) {
    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${type}`;


    const text =
        document.createElement("span");

    text.className =
        "message-text";

    text.textContent =
        message;


    const timestamp =
        document.createElement("span");

    timestamp.className =
        "timestamp";

    timestamp.textContent =
        getTime();


    wrapper.appendChild(
        text
    );

    wrapper.appendChild(
        timestamp
    );

    conversation.appendChild(
        wrapper
    );

    scrollToBottom();
}


function scrollToBottom() {
    conversation.scrollTop =
        conversation.scrollHeight;
}


function setInputEnabled(
    enabled
) {
    input.disabled =
        !enabled;

    sendButton.disabled =
        !enabled;
}


function setStatus(
    newStatus
) {
    status.textContent =
        newStatus;
}


function setProcessing(
    active
) {
    processing.classList.toggle(
        "hidden",
        !active
    );
}


function setRingStatus(
    newStatus
) {
    ring.classList.remove(
        "processing",
        "speaking"
    );


    if (
        newStatus ===
        "PROCESSING"
    ) {
        ring.classList.add(
            "processing"
        );
    }


    if (
        newStatus ===
        "SPEAKING"
    ) {
        ring.classList.add(
            "speaking"
        );
    }
}


form.addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();


        const message =
            input.value.trim();


        if (!message) {
            return;
        }


        // ----------------------------------
        // GET LOGIN TOKEN
        // ----------------------------------

        const token =
            sessionStorage.getItem(
                "lucy_token"
            );


        if (!token) {
            setStatus(
                "OFFLINE"
            );

            addMessage(
                "AUTHENTICATION REQUIRED",
                "lucy"
            );

            return;
        }


        // ----------------------------------
        // USER MESSAGE
        // ----------------------------------

        setInputEnabled(
            false
        );

        addMessage(
            message,
            "user"
        );

        input.value = "";


        // ----------------------------------
        // PROCESSING
        // ----------------------------------

        setStatus(
            "PROCESSING..."
        );

        setRingStatus(
            "PROCESSING"
        );

        setProcessing(
            true
        );


        try {
            const response =
                await fetch(
                    LUCY_CLOUD_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: message,
                            session_id:
                                SESSION_ID,
                            token: token
                        })
                    }
                );


            // ----------------------------------
            // AUTH EXPIRED / INVALID
            // ----------------------------------

            if (
                response.status === 401
            ) {
                sessionStorage.removeItem(
                    "lucy_token"
                );

                window.location.href =
                    "login.html";

                return;
            }


            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            const lucyResponse =
                data.response.trim();


            // ----------------------------------
            // LUCY RESPONSE
            // ----------------------------------

            setProcessing(
                false
            );

            setStatus(
                "LISTENING"
            );

            setRingStatus(
                "IDLE"
            );


            addMessage(
                lucyResponse,
                "lucy"
            );


        } catch (error) {
            console.error(
                "Lucy cloud error:",
                error
            );


            setProcessing(
                false
            );

            setStatus(
                "ERROR"
            );

            setRingStatus(
                "IDLE"
            );


            addMessage(
                "SYSTEM ERROR",
                "lucy"
            );
        }


        setInputEnabled(
            true
        );

        input.focus();
    }
);