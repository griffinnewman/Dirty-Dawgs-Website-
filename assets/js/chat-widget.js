(function () {
  "use strict";

  var CHAT_ENDPOINT = "/api/chat-send";
  var POLL_INTERVAL_MS = 3000;
  var TIMEOUT_MINUTES = 45;
  var SESSION_KEY = "ddChatSessionId";
  var MESSAGES_KEY = "ddChatMessages";
  var TEASER_DISMISSED_KEY = "ddChatTeaserDismissed";
  var AVATAR_SRC = "/assets/img/griffin.jpg";

  var QUICK_REPLIES = ["Get a Quote", "Ask a Question", "Something Else"];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    var id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function getMessages() {
    try {
      return JSON.parse(sessionStorage.getItem(MESSAGES_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveMessages(messages) {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  var css =
    ".dd-chat-toggle{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:var(--teal,#3B5C45);color:#fff;border:none;box-shadow:var(--shadow-lg,0 8px 40px rgba(0,0,0,.14));cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;padding:0;overflow:visible;}" +
    ".dd-chat-toggle:hover{transform:scale(1.06);}" +
    ".dd-chat-toggle-hidden{display:none;}" +
    ".dd-chat-toggle svg{width:26px;height:26px;}" +
    ".dd-chat-toggle img{width:100%;height:100%;border-radius:50%;object-fit:cover;}" +
    ".dd-chat-toggle-icon{position:absolute;bottom:-3px;right:-3px;width:24px;height:24px;background:var(--gold,#C0953A);border-radius:50%;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;}" +
    ".dd-chat-toggle-icon svg{width:13px;height:13px;color:#fff;}" +
    ".dd-chat-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9997;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;}" +
    ".dd-chat-backdrop.show{display:flex;}" +
    ".dd-chat-panel{width:380px;max-width:100%;height:auto;max-height:420px;background:#fff;border-radius:var(--radius,12px);box-shadow:var(--shadow-lg,0 8px 40px rgba(0,0,0,.14));z-index:9999;display:flex;flex-direction:column;overflow:hidden;font-family:var(--font,sans-serif);}" +
    ".dd-chat-head{background:var(--teal,#3B5C45);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}" +
    ".dd-chat-head-avatar{position:relative;width:42px;height:42px;flex-shrink:0;}" +
    ".dd-chat-head-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.6);}" +
    ".dd-chat-head-avatar .dd-chat-avatar-fallback{width:100%;height:100%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.6);font-size:20px;}" +
    ".dd-chat-status-dot{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#4CAF6D;border:2px solid var(--teal,#3B5C45);}" +
    ".dd-chat-head-text{flex:1;min-width:0;}" +
    ".dd-chat-head-text h4{margin:0;font-size:.95rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
    ".dd-chat-head-text p{margin:2px 0 0;font-size:.72rem;color:rgba(255,255,255,.8);}" +
    ".dd-chat-close{background:none;border:none;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:4px;flex-shrink:0;opacity:.85;}" +
    ".dd-chat-close:hover{opacity:1;}" +
    ".dd-chat-body{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--off-white,#f8f9fa);}" +
    ".dd-chat-disclaimer{background:#eef0ef;color:var(--text-mid,#54595F);font-size:.72rem;line-height:1.5;font-style:italic;padding:10px 12px;border-radius:10px;}" +
    ".dd-chat-disclaimer a{color:var(--teal,#3B5C45);}" +
    ".dd-chat-date{align-self:center;font-size:.7rem;color:var(--text-muted,#7A7A7A);margin:2px 0;}" +
    ".dd-chat-row{display:flex;align-items:flex-end;gap:6px;max-width:88%;}" +
    ".dd-chat-row.visitor{align-self:flex-end;flex-direction:row-reverse;}" +
    ".dd-chat-row.owner,.dd-chat-row.system{align-self:flex-start;}" +
    ".dd-chat-avatar-fallback{display:flex;align-items:center;justify-content:center;border-radius:50%;line-height:1;}" +
    ".dd-chat-avatar-sm{width:24px;height:24px;background:var(--teal-light,#EAF0EA);font-size:13px;flex-shrink:0;border-radius:50%;object-fit:cover;}" +
    ".dd-chat-msg{padding:9px 12px;border-radius:14px;font-size:.85rem;line-height:1.4;white-space:pre-wrap;}" +
    ".dd-chat-row.visitor .dd-chat-msg{background:var(--teal,#3B5C45);color:#fff;border-bottom-right-radius:4px;}" +
    ".dd-chat-row.owner .dd-chat-msg{background:#fff;color:var(--text,#2d2d2d);border:1px solid var(--light-gray,#f0f2f4);border-bottom-left-radius:4px;}" +
    ".dd-chat-row.system .dd-chat-msg{background:var(--gold-light,#FBF3E0);color:var(--text-mid,#54595F);font-size:.76rem;}" +
    ".dd-chat-typing{align-self:flex-start;font-size:.76rem;color:var(--text-muted,#7A7A7A);padding:0 4px;}" +
    ".dd-chat-quick{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;padding-left:30px;}" +
    ".dd-chat-quick button{background:#fff;border:1.5px solid var(--teal,#3B5C45);color:var(--teal,#3B5C45);border-radius:999px;padding:6px 12px;font-size:.78rem;font-weight:600;cursor:pointer;}" +
    ".dd-chat-quick button:hover{background:var(--teal-light,#EAF0EA);}" +
    ".dd-chat-foot{border-top:1px solid var(--light-gray,#f0f2f4);padding:10px;display:flex;align-items:flex-end;gap:8px;background:#fff;flex-shrink:0;}" +
    ".dd-chat-foot textarea{flex:1;resize:none;border:1px solid var(--light-gray,#f0f2f4);border-radius:20px;padding:9px 14px;font-family:inherit;font-size:16px;height:38px;max-height:80px;}" +
    ".dd-chat-send{background:var(--gold,#C0953A);color:#fff;border:none;border-radius:50%;width:38px;height:38px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;}" +
    ".dd-chat-send svg{width:18px;height:18px;}" +
    ".dd-chat-send:disabled{opacity:.5;cursor:not-allowed;}" +
    "@keyframes ddChatPulse{0%{box-shadow:0 0 0 0 rgba(59,92,69,.5);}70%{box-shadow:0 0 0 16px rgba(59,92,69,0);}100%{box-shadow:0 0 0 0 rgba(59,92,69,0);}}" +
    ".dd-chat-toggle.pulse{animation:ddChatPulse 1.8s ease-out 3;}" +
    ".dd-chat-teaser{position:fixed;bottom:92px;right:20px;max-width:220px;background:#fff;color:var(--text,#2d2d2d);padding:12px 30px 12px 14px;border-radius:14px 14px 4px 14px;box-shadow:var(--shadow-lg,0 8px 40px rgba(0,0,0,.14));font-size:.85rem;line-height:1.4;z-index:9998;cursor:pointer;display:none;}" +
    ".dd-chat-teaser.show{display:block;animation:ddChatTeaserIn .25s ease;}" +
    "@keyframes ddChatTeaserIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}" +
    ".dd-chat-teaser-close{position:absolute;top:4px;right:6px;background:none;border:none;font-size:16px;line-height:1;cursor:pointer;color:var(--text-muted,#7A7A7A);padding:4px;}" +
    "@media(max-width:640px){" +
    ".dd-chat-teaser{right:12px;bottom:82px;}" +
    ".dd-chat-toggle{width:52px;height:52px;bottom:16px;right:16px;}" +
    ".dd-chat-backdrop.expanded{padding:0;}" +
    ".dd-chat-panel.expanded{width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0;}" +
    ".dd-chat-panel.expanded .dd-chat-head{padding:16px;padding-top:max(16px,env(safe-area-inset-top));flex-shrink:0;}" +
    ".dd-chat-panel.expanded .dd-chat-foot{padding-bottom:max(10px,env(safe-area-inset-bottom));flex-shrink:0;}" +
    "}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var toggle = document.createElement("button");
  toggle.className = "dd-chat-toggle";
  toggle.setAttribute("aria-label", "Chat with Dirty Dawgs");
  toggle.innerHTML =
    '<img src="' + AVATAR_SRC + '" alt="" onerror="this.style.display=&quot;none&quot;;this.nextElementSibling.style.display=&quot;block&quot;">' +
    '<svg style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
    '<span class="dd-chat-toggle-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg></span>';

  var teaser = document.createElement("div");
  teaser.className = "dd-chat-teaser";
  teaser.innerHTML =
    '<button class="dd-chat-teaser-close" aria-label="Dismiss">&times;</button>' +
    "<p>👋 Got a question? We're here to help!</p>";

  var backdrop = document.createElement("div");
  backdrop.className = "dd-chat-backdrop";

  var todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  var panel = document.createElement("div");
  panel.className = "dd-chat-panel";
  panel.innerHTML =
    '<div class="dd-chat-head">' +
    '<div class="dd-chat-head-avatar"><img src="' + AVATAR_SRC + '" alt="Griffin" onerror="this.style.display=&quot;none&quot;;this.nextElementSibling.style.display=&quot;flex&quot;"><span class="dd-chat-avatar-fallback" style="display:none">🐾</span><span class="dd-chat-status-dot"></span></div>' +
    '<div class="dd-chat-head-text"><h4>Dirty Dawgs</h4><p>Chatting with Griffin</p></div>' +
    '<button class="dd-chat-close" aria-label="Close chat">&times;</button>' +
    "</div>" +
    '<div class="dd-chat-body" id="ddChatBody">' +
    '<div class="dd-chat-disclaimer">This chat may be used to follow up about your service request. By using this chat, you agree to our <a href="#" target="_blank" rel="noopener">Terms of Service</a> and <a href="#" target="_blank" rel="noopener">Privacy Policy</a>.</div>' +
    '<div class="dd-chat-date">' + todayLabel + "</div>" +
    "</div>" +
    '<div class="dd-chat-foot">' +
    '<textarea id="ddChatInput" placeholder="Type a message..." maxlength="500"></textarea>' +
    '<button id="ddChatSend" class="dd-chat-send" aria-label="Send">' +
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>' +
    "</button>" +
    "</div>";

  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
  document.body.appendChild(toggle);
  document.body.appendChild(teaser);

  var body = panel.querySelector("#ddChatBody");
  var input = panel.querySelector("#ddChatInput");
  var sendBtn = panel.querySelector("#ddChatSend");
  var closeBtn = panel.querySelector(".dd-chat-close");

  function renderMessage(msg) {
    var row = document.createElement("div");
    row.className = "dd-chat-row " + msg.from;
    if (msg.from === "owner" || msg.from === "system") {
      var avatarImg = document.createElement("img");
      avatarImg.className = "dd-chat-avatar-sm";
      avatarImg.src = AVATAR_SRC;
      avatarImg.alt = "";
      var avatarFallback = document.createElement("span");
      avatarFallback.className = "dd-chat-avatar-sm dd-chat-avatar-fallback";
      avatarFallback.textContent = "🐾";
      avatarFallback.style.display = "none";
      avatarImg.onerror = function () {
        this.style.display = "none";
        avatarFallback.style.display = "flex";
      };
      row.appendChild(avatarImg);
      row.appendChild(avatarFallback);
    }
    var bubble = document.createElement("div");
    bubble.className = "dd-chat-msg";
    bubble.textContent = msg.text;
    row.appendChild(bubble);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(from, text) {
    var messages = getMessages();
    messages.push({ from: from, text: text });
    saveMessages(messages);
    renderMessage({ from: from, text: text });
  }

  var quickRepliesEl = null;
  function removeQuickReplies() {
    if (quickRepliesEl) {
      quickRepliesEl.remove();
      quickRepliesEl = null;
    }
  }

  function showQuickReplies() {
    quickRepliesEl = document.createElement("div");
    quickRepliesEl.className = "dd-chat-quick";
    QUICK_REPLIES.forEach(function (label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        removeQuickReplies();
        input.value = label;
        send();
      });
      quickRepliesEl.appendChild(btn);
    });
    body.appendChild(quickRepliesEl);
    body.scrollTop = body.scrollHeight;
  }

  var existingMessages = getMessages();
  existingMessages.forEach(renderMessage);
  if (existingMessages.length === 0) {
    renderMessage({ from: "owner", text: "Hi, I'm Griffin 🐾 Ask me anything about pricing, scheduling, or your service area." });
    showQuickReplies();
    // Start scrolled to the top (disclaimer + greeting), not auto-scrolled
    // to the bottom like it would be for an active back-and-forth.
    body.scrollTop = 0;
  } else {
    // Returning to an existing conversation — skip the compact teaser step.
    panel.classList.add("expanded");
    backdrop.classList.add("expanded");
  }

  function dismissTeaser() {
    teaser.classList.remove("show");
    toggle.classList.remove("pulse");
    sessionStorage.setItem(TEASER_DISMISSED_KEY, "1");
  }

  var opened = false;
  function openChat() {
    opened = true;
    backdrop.classList.add("show");
    toggle.classList.add("dd-chat-toggle-hidden");
    dismissTeaser();
    // Deliberately not auto-focusing the input — that opens the keyboard
    // immediately, which shrinks the visible screen before the visitor has
    // even seen the full card. Let them tap in when they're ready to type.
  }
  function closeChat() {
    opened = false;
    backdrop.classList.remove("show");
    toggle.classList.remove("dd-chat-toggle-hidden");
  }

  toggle.addEventListener("click", function () {
    if (opened) {
      closeChat();
    } else {
      openChat();
    }
  });
  closeBtn.addEventListener("click", closeChat);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeChat();
  });
  teaser.addEventListener("click", function (e) {
    if (e.target.closest(".dd-chat-teaser-close")) {
      dismissTeaser();
      return;
    }
    openChat();
  });

  if (existingMessages.length === 0 && !sessionStorage.getItem(TEASER_DISMISSED_KEY)) {
    setTimeout(function () {
      if (!opened) {
        teaser.classList.add("show");
        toggle.classList.add("pulse");
      }
    }, 5000);
  }

  var polling = null;

  function setSending(isSending) {
    input.disabled = isSending;
    sendBtn.disabled = isSending;
  }

  function pollForReply(runId, deadline) {
    if (polling) clearInterval(polling);
    var typingEl = document.createElement("div");
    typingEl.className = "dd-chat-typing";
    typingEl.textContent = "Waiting for a reply...";
    body.appendChild(typingEl);
    body.scrollTop = body.scrollHeight;

    polling = setInterval(function () {
      if (Date.now() > deadline) {
        clearInterval(polling);
        typingEl.remove();
        addMessage("system", "We haven't replied yet — please call/text us at (678) 327-9646 if it's urgent.");
        setSending(false);
        return;
      }

      fetch("/api/chat-poll?runId=" + encodeURIComponent(runId))
        .then(function (res) {
          if (!res.ok) throw new Error("poll failed: " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data.ok || !data.done) return;
          clearInterval(polling);
          typingEl.remove();
          setSending(false);
          var output = data.output;
          if (output && output.status === "replied") {
            addMessage("owner", output.reply);
          } else {
            addMessage("system", "We haven't replied yet — please call/text us at (678) 327-9646 if it's urgent.");
          }
        })
        .catch(function () {
          // transient network error — keep polling until deadline
        });
    }, POLL_INTERVAL_MS);
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;

    removeQuickReplies();
    panel.classList.add("expanded");
    backdrop.classList.add("expanded");

    addMessage("visitor", text);
    input.value = "";
    setSending(true);

    fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        message: text,
        page: location.pathname,
        timeoutMinutes: TIMEOUT_MINUTES,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send");
          return data;
        });
      })
      .then(function (data) {
        var deadline = Date.now() + (TIMEOUT_MINUTES + 5) * 60000;
        pollForReply(data.runId, deadline);
      })
      .catch(function () {
        setSending(false);
        addMessage("system", "Couldn't send that. Please call/text us at (678) 327-9646.");
      });
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();
