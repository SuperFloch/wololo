<template>
  <q-layout view="lHh Lpr lFf" style="background-image:url('img/bg.jpg')">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MainLayout',
})
</script>
