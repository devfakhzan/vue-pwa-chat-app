<template>
  <v-list subheader>
    <v-subheader>
      <strong>Online People ({{onlines.length}})</strong>
    </v-subheader>
    <v-list-item v-for="online in onlines" :key="online.username" to="#">
      <v-list-item-content>
        <v-list-item-title v-html="online.username"></v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-icon color="green">mdi-circle</v-icon>
      </v-list-item-action>
    </v-list-item>
  </v-list>
</template>

<script>
  export default {
    name: 'OnlineListSubcomp',
    computed: {
      onlines() {
        return this.$store.state.onlineUsers
      }
    }
  }
</script>