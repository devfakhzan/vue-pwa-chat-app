import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);
//Firebase
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  query,
  limitToLast,
  onChildAdded,
  endAt,
  orderByChild,
  onDisconnect,
  onChildRemoved
} from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyBfXDmBmiZ69zK1_hSE3S3OF9UFEjcx7tE",
  authDomain: "test-5b1f3.firebaseapp.com",
  databaseURL:
    "https://test-5b1f3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-5b1f3",
  storageBucket: "test-5b1f3.appspot.com",
  messagingSenderId: "736461588214",
  appId: "1:736461588214:web:62233f7e4f4d2aa56e8ed7",
};
//End of Firebase

export default new Vuex.Store({
  state: {
    firebase: initializeApp(firebaseConfig),
    messages: [],
    getMessagesAmount: 20,
    fetching: false,
    cc: null,
    login: {
      uuid: null,
      username: null,
    },
    onlineUsers: [],
    shouldNotScrollToBottom: false,
    emojiFiestaRunning: false,
    emojiFiestaDurationInMs: 9000,
    foundEmoji: ''
  },
  getters: {},
  mutations: {
    logout(state) {
      localStorage.removeItem("username");
      localStorage.removeItem("uuid");

      state.login = {
        uuid: null,
        username: null,
      }
    },
    removeOnlineUser(state, uuid) {
      state.onlineUsers = state.onlineUsers.filter(u => u.uuid !== uuid);
    },
    write(state, payload) {
      const db = getDatabase(this.firebase);
      if (payload.message) {
        push(ref(db, "messages/"), payload);
      }
    },
    setMessage(state, payload) {
      state.messages.push(payload);
      state.messages.sort((a, b) => {
        return a.timestamp - b.timestamp;
      });
    },
    setFetching(state, fetching) {
      state.fetching = fetching;
    },
    setLogin(state, payload) {
      state.login.uuid = payload.uuid;
      state.login.username = payload.username;
      localStorage.setItem("username", payload.username);
      localStorage.setItem("uuid", payload.uuid);
      this.dispatch("fetchOnlineUsers");
    },
    setOnlineUser(state, userPayload) {
      state.onlineUsers.push(userPayload);
    },
    setShouldNotScrollToBottom(state, should) {
      state.shouldNotScrollToBottom = should;
    },
    emojiFiesta(state, strObj) {
      if (strObj.end) {
        state.emojiFiestaRunning = false;
        state.foundEmoji = '';
        return;
      }
      const isThereEmoji = strObj.str.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/)
      if (isThereEmoji && !state.emojiFiestaRunning) {
        state.foundEmoji = isThereEmoji[0];
        state.emojiFiestaRunning = true;
        setTimeout(()=> {
          state.emojiFiestaRunning = false;
          state.foundEmoji = '';
        }, state.emojiFiestaDurationInMs);
      }
    },
  },
  actions: {
    async fetchOnlineUsers(ctx) {
      const dbRef = ref(getDatabase(this.firebase), "users/");
      const myDbRef = ref(
        getDatabase(this.firebase),
        `users/${ctx.state.login.uuid}`
      );
      const snapshot = await query(dbRef);

      onChildAdded(snapshot, async (data) => {
        const child = { key: data.key, ...data.val() };
        if (!ctx.state.onlineUsers.find((m) => m.key == data.key)) {
          ctx.commit("setOnlineUser", child);
        }
      });

      onChildRemoved(snapshot, (data) => {
        ctx.commit('removeOnlineUser', data.val().uuid );
      })

      onDisconnect(myDbRef).remove();
    },
    async fetchLastMessages(ctx, chatContainerOpt) {
      ctx.state.cc = chatContainerOpt.cc;
      const dbRef = ref(getDatabase(this.firebase), "messages/");
      try {
        const snapshot = await query(
          dbRef,
          limitToLast(ctx.state.getMessagesAmount)
        );

        onChildAdded(snapshot, async (data) => {
          const child = { key: data.key, ...data.val() };
          if (!ctx.state.messages.find((m) => {
            return m.key == data.key
          })) {
            ctx.commit("setMessage", child);
            if (ctx.state.messages.length > 20) {
              ctx.commit("emojiFiesta", {str: data.val().message})
            }
          }
          await ctx.dispatch("scrollToBottom");
        });
      } catch (e) {
        console.error(e);
      }
    },
    async fetchMoreMessages(ctx, lastMessageKey) {
      if (ctx.state.fetching) {
        return;
      }

      const dbRef = ref(getDatabase(this.firebase), "messages/");
      try {
        ctx.commit("setFetching", true);
        const snapshot = await query(
          dbRef,
          endAt(lastMessageKey + "", "timestamp"),
          orderByChild("timestamp"),
          limitToLast(ctx.state.getMessagesAmount)
        );

        onChildAdded(snapshot, async (data) => {
          const child = { key: data.key, ...data.val() };
          if (!ctx.state.messages.find((m) => {
            return m.key == data.key
          })) {
            ctx.commit("setMessage", child);
          }
        });

        //Atrificial throttling
        setTimeout(() => {
          ctx.commit("setFetching", false);
        }, 500);
      } catch (e) {
        console.error(e);
      }
    },
    async scrollToBottom(ctx) {
      await this._vm.$nextTick();
      if (!ctx.state.shouldNotScrollToBottom) {
        ctx.state.cc.scrollTo({
          top: ctx.state.cc.scrollHeight,
          behavior: "smooth",
        });
      }
    },
    async login(ctx, payload) {
      const db = getDatabase(this.firebase);
      set(ref(db, `users/${payload.uuid}`), payload).then(() => {
        this.commit("setLogin", payload);
      });
    },
  },
  modules: {},
});
