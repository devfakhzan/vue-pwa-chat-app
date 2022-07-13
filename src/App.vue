<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <h1>Vue-PWA-Chat-App</h1>
      </div>

      <v-spacer></v-spacer>
      <v-btn @click="logout" v-if="loggedIn">
        Logout
      </v-btn>
      <v-btn
        href="https://github.com/devfakhzan/vue-pwa-chat-app"
        target="_blank"
        text
      >
        <span class="mr-2">GitHub</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
  }),
  async created() {
    const uuid = localStorage.getItem('uuid');
    const username = localStorage.getItem('username');
    if (!uuid || !username) {
      this.$router.push('/login');
      return;
    }

    await this.$store.dispatch('login', {
      username,
      uuid
    });

  },
  methods: {
    logout() {
      if (!confirm('Are you sure you want to logout?')) {
        return;
      }

      this.$store.commit('logout');
      window.location.reload();
    }
  },
  watch: {
    '$store.state.login': {
      handler(val) {
        if (val?.uuid && val?.username && this.$route.fullPath !== '/'){
          this.$router.push('/')
        }
      },
      deep: true
    }
  },
  computed: {
    loggedIn() {
      return this.$store.state.login?.username && this.$store.state.login?.uuid;
    }
  }
};
</script>
