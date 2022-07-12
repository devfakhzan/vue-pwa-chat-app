<template>
  <div>
    <div class="message-container" v-for="(message,index) in messages" :key="index" :class="{own: message.from == username}">
      <div class="from" v-if="index> 0 && messages[index-1].from != message.from">{{ifOnlineName(message.from).username}}<i>{{ youString(message.from)}}</i>:</div>
      <div class="from" v-if="index == 0">{{ifOnlineName(message.from).username}}<i>{{ youString(message.from)}}</i>:</div>
      <div style="margin-top: 5px"></div>
      <div>
      <small>Message count: #{{messages.length - index}}</small>
      </div>
      <div class="message">
        <div>{{message.message}}</div>
      </div>
      
    </div>
  </div>
</template>

<script>
  export default {
    name: 'MessagesSubcomp',
    data () {
      return {
      }
    },
    props: [
      'messages'
    ],
    computed: {
      username () {
        return this.$store.state.login?.uuid || ''
      }
    },
    methods: {
      youString(from){
        if (!this.ifOnlineName(from).uuid) {
          if (from === this.username) {
            return ' (You)'
          }
          return ' (Online)';
        }
        return ' (Offline)';
        
      },
      ifOnlineName(uuid){
        const match = this.$store.state?.onlineUsers?.find(u => {
          return u.uuid === uuid
        });
        if (match) {
          return {
            username: match.username,
            uuid: false
          }
        }
        
        return {
          username: uuid,
          uuid: true
        }
      }
    }
  }
</script>