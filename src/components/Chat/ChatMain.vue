<template>
  <v-container fluid style="padding: 0;">
    <v-row no-gutters>
      <v-col cols="3" lg="2" v-if="!screen.is.mobileandsmaller" class="scrollable">
        <online-list-subcomp/>
      </v-col>
      <v-col :cols="!screen.is.mobileandsmaller ? 9 : 12" lg="10" style="position: relative;">
        <div class="chat-container"  ref="chat-container" >
          <div id="fetching-messages" v-if="fetching">Fetching messages...</div>
          <messages-subcomp :messages="messages"></messages-subcomp>
          <div id="scroll-to-bottom-button" @click="scrollToBottomInstant" v-if="showScrollToBottomButton">↓</div>
          <div id="emoji-fiesta-container" v-if="emojiFiestaRunning" @click="endEmojiFiesta" @mousewheel="endEmojiFiesta">
            <div class="emoji-1 emoji-container emoji-animation-x">
              <div class="emoji-large emoji-animation-y">{{foundEmoji}}</div>
            </div>

            <div class="emoji-2 emoji-container emoji-animation-x">
              <div class="emoji-large emoji-animation-y">{{foundEmoji}}</div>
            </div>

            <div class="emoji-3 emoji-container emoji-animation-x">
              <div class="emoji-large emoji-animation-y">{{foundEmoji}}</div>
            </div>
            
            <div class="emoji-4 emoji-container emoji-animation-x">
              <div class="emoji-small emoji-animation-y">{{foundEmoji}}</div>
            </div>
            
            <div class="emoji-5 emoji-container emoji-animation-x">
              <div class="emoji-small emoji-animation-y">{{foundEmoji}}</div>
            </div>
            
            <div class="emoji-6 emoji-container emoji-animation-x">
              <div class="emoji-small emoji-animation-y">{{foundEmoji}}</div>
            </div>
            
            <div class="emoji-7 emoji-container emoji-animation-x">
              <div class="emoji-small emoji-animation-y">{{foundEmoji}}</div>
            </div>
            
            <div class="emoji-8 emoji-container emoji-animation-x">
              <div class="emoji-small emoji-animation-y">{{foundEmoji}}</div>
            </div>
          
          </div>
        </div>
        <div class="typer">
          <input type="text" ref="input-area" placeholder="Type here and press enter to send" @keyup.enter="sendMessage" v-model="content" maxlength="250">
        
          <emoji-picker @emoji="appendEmoji" :search="searchEmoji">
            <v-btn
              class="emoji-invoker"
              slot="emoji-invoker"
              slot-scope="{ events: { click: clickEvent } }"
              @click.stop="clickEvent"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fill-current text-grey">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </v-btn>
            <div slot="emoji-picker" slot-scope="{ emojis, insert, display }">
              <div class="emoji-picker" :style="{ top: display.y + 'px', left: display.x + 'px' }">
                <div class="emoji-picker__search">
                </div>
                <div>
                  <div v-for="(emojiGroup, category) in emojis" :key="category">
                    <h5>{{ category }}</h5>
                    <div class="emojis">
                      <span
                        v-for="(emoji, emojiName) in emojiGroup"
                        :key="emojiName"
                        @click="insert(emoji)"
                        :title="emojiName"
                      >{{ emoji }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </emoji-picker>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import MessagesSubcomp from '@/components/Chat/subcomponents/MessagesSubcomp.vue'
  import OnlineListSubcomp from '@/components/Chat/subcomponents/OnlineListSubcomp.vue'
  import ScreenSizeDetector from 'screen-size-detector';
  import EmojiPicker from 'vue-emoji-picker';

  export default {
    name: 'ChatMain',
    data() {
      return {
        searchEmoji: '',
        screen: new ScreenSizeDetector({
          widthDefinitions: {
            mobileandsmaller: {
              min: 0,
              max: 480,
              inclusion: "[]",
            }
          }
        }),
        content: '',
        showScrollToBottomButton: false,
        currentTopMessageKey: null,
        cc: null,
        emojiFiestaDurationInMs: 9000
      }
    },
    directives: {
      focus: {
        inserted(el) {
          el.focus()
        },
      },
    },
    methods: {
      appendEmoji(emoji){
        this.content += emoji;
        console.log(this.$refs['input-area'])
        this.$refs['input-area'].click();
      },
      endEmojiFiesta(){
        this.$store.commit('emojiFiesta', {end: true});
      },
      async getScrollDirection(e) {
        this.handleChatScroll();
        if (this.isScrollUp(e) && this.cc?.scrollTop == 0 && !this.fetching) {
          await this.fetchMoreMessages();
        }
      },
      isScrollUp(e) {
        if (e.type === 'wheel') {
          if (e.wheelDelta) {
            return e.wheelDelta > 0;
          }
          return e.deltaY < 0;
        }

        if (this.cc.scrollTop === 0) {
          return true;
        }
        return false;
      },
      sendMessage() {
        if (!this.content?.trim()) {
          return;
        }
        this.$store.commit('write',{
            "from": this.user.uuid,
            "message": this.content.trim(),
            "timestamp": new Date().getTime()
        });
        this.content = '';
      },
      handleChatScroll() {
        const pos = this.cc.scrollTop;
        const scrollHeight = this.cc.scrollHeight;

        if (scrollHeight - pos > 1000) {
          this.showScrollToBottomButton = true;
          this.$store.commit('setShouldNotScrollToBottom', true);
        } else {
          this.showScrollToBottomButton = false;
          this.$store.commit('setShouldNotScrollToBottom', false);
        }
      },
      scrollToBottomInstant(){
        this.cc.scrollTo({
          top: this.cc.scrollHeight,
          behavior: "smooth",
        })
      },
      async scrollToBottom() {
        await this.$store.dispatch('scrollToBottom', this.getScrollToBottomOpt())
      },
      getScrollToBottomOpt(initialFetch){
        const opt = {}
        opt.cc = this.cc;
        opt.initialFetch = initialFetch;
        return opt;
      },
      async fetchLastMessages(){
        await this.$store.dispatch('fetchLastMessages', this.getScrollToBottomOpt(true));
        if (this.messages.length) {
          this.currentTopMessageKey = this.messages[0].timestamp;
        }
      },
      async fetchOnlineUsers(){
        await this.$store.dispatch('fetchOnlineUsers');
      },
      async fetchMoreMessages() {
        await this.$store.dispatch('fetchMoreMessages', this.messages[0].timestamp)
      }
    },
    watch: {
      '$store.state.messages': {
        handler(val) {
          this.currentTopMessageKey = val[0].key;
        },
        deep: true
      }
    },
    components: {
      OnlineListSubcomp,
      MessagesSubcomp,
      EmojiPicker
    },
    computed: {
      foundEmoji(){
        return this.$store.state.foundEmoji;
      },
      emojiFiestaRunning(){
        return this.$store.state?.emojiFiestaRunning;
      },
      messages(){
        return this.$store.state.messages
      },
      fetching() {
        return this.$store.state.fetching
      },
      user(){
        return this.$store.state.login;
      }
    },
    mounted(){
      this.cc = this.$refs['chat-container'];
      this.fetchLastMessages();
      this.fetchOnlineUsers();
      this.cc.onscroll =  e => this.getScrollDirection(e);
      this.cc.addEventListener('wheel', e => this.getScrollDirection(e));
    }
  }
</script>