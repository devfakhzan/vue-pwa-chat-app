

<template>
  <v-main>
         <v-container fluid fill-height>
            <v-layout align-center justify-center>
               <v-flex xs12 sm8 md4>
                  <v-card class="elevation-12">
                     <v-toolbar dark color="primary">
                        <v-toolbar-title>Login</v-toolbar-title>
                     </v-toolbar>
                     <v-card-text>
                        <v-text-field
                          name="login"
                          label="Username"
                          type="text"
                          maxlength="20"
                          v-model="username"
                          @keyup.enter="login"
                        ></v-text-field>
                     </v-card-text>
                     <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="login" :disabled="!username.trim()">Login</v-btn>
                     </v-card-actions>
                  </v-card>
               </v-flex>
            </v-layout>
         </v-container>
      </v-main>
</template>

<script>
import { uuidv4 } from '@firebase/util';
export default {
  data() {
    return {
      username: '',
      uuid: null
    }
  },
  created() {
    const uuid = localStorage.getItem('uuid');
    if (!uuid) {
      const uuid = uuidv4();
      localStorage.setItem('uuid', uuid);
      this.uuid = uuid;
      return;
    }

    this.uuid = uuid;
  },
  methods: {
    login() {
      const payload = {
        username: this.username?.trim(),
        uuid: this.uuid
      }
      this.$store.dispatch('login', payload);
    }
  }
}
</script>
