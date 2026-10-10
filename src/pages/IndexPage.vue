<template>
  <q-header elevated class="aoeHeader" style="background-image:url('img/frise.jpg')">
    <q-toolbar class="aoeToolbar">
      <q-toolbar-title class="aoeLogo">Wololo</q-toolbar-title>
      <q-btn round :icon="muted ? 'volume_off' : 'volume_up'" color="blue" size="sm" glossy class="q-mr-sm aoe-btn" @click="toggleSound" title="Mute"></q-btn>
      <q-btn round icon="wash" color="orange" size="sm" glossy class="q-mr-sm aoe-btn" @click="clear" title="Clear cache"></q-btn>
      <q-btn round icon="close" color="red" size="sm" glossy class="aoe-btn" @click="quit" title="Quit"></q-btn>
    </q-toolbar>
  </q-header>
  <q-page class="pageBody">
    <div class="sideBar">
      <file-manager @change="onMainFileChange" ref="fileManager"></file-manager>
    </div>
    <div class="convertPart">
      <q-tabs v-model="tab" class="aoeTabs" active-color="indigo-10" active-bg-color="amber-5" indicator-color="indigo-10" mobile-arrows no-caps>
        <q-tab name="convert" icon="church" label="Conversion" />
        <q-tab name="videoClip" icon="movie" label="Video Clip" />
        <q-tab name="videoCrop" icon="crop" label="Video Crop" />
        <q-tab name="ytTool" icon="download" label="Youtube" />
        <q-tab name="removeBg" icon="portrait" label="Remove Bg" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="main aoe-panel">
        <q-tab-panel name="convert">
          <ConvertPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></ConvertPage>
        </q-tab-panel>
        <q-tab-panel name="videoClip">
          <VideoClipPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></VideoClipPage>
        </q-tab-panel>
        <q-tab-panel name="videoCrop">
          <VideoCropPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></VideoCropPage>
        </q-tab-panel>
        <q-tab-panel name="ytTool">
          <VideoDownloadPage @error="toast" :muted="muted" @output="refreshHistory"></VideoDownloadPage>
        </q-tab-panel>
        <q-tab-panel name="removeBg">
          <RemoveBgPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></RemoveBgPage>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div class="toast errorToast" v-show="lastError != null">
      <div class="toastTitle">Error</div>
      <div>{{ lastError }}</div>
    </div>
    <div class="toast infoToast" v-show="lastInfo != null">
      <div class="toastTitle">Info</div>
      <div>{{ lastInfo }}</div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import ConvertPage from 'components/ConvertPage.vue';
import VideoDownloadPage from 'src/components/VideoDownloadPage.vue';
import VideoClipPage from 'src/components/VideoClipPage.vue';
import VideoCropPage from 'src/components/VideoCropPage.vue';
import RemoveBgPage from 'src/components/RemoveBgPage.vue';
import FileManager from 'src/components/FileManager.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    ConvertPage,
    VideoDownloadPage,
    VideoClipPage,
    VideoCropPage,
    RemoveBgPage,
    FileManager
  },
  data() {
    return {
      lastError: null,
      lastInfo: null,
      muted: false,
      currentInputFile: null
    }
  },
  setup() {
    return {
      tab: ref('convert')
    }
  },
  methods: {
    toast(msg, error = true) {
      if (error) {
        this.lastError = msg;
      } else {
        this.lastInfo = msg;
      }
      setTimeout(() => {
        this.lastError = null;
        this.lastInfo = null;
      }, 5000)
    },
    quit() {
      window.ipcRenderer.send('quit')
    },
    clear() {
      window.ipcRenderer.invoke('clear').then(() => {
        this.toast('Cache cleared', false)
      })
    },
    toggleSound() {
      this.muted = !this.muted
    },
    onMainFileChange(file){
      this.currentInputFile = file
    },
    refreshHistory(){
      this.$refs.fileManager.loadHistory()
    }
  }
})
</script>
<style scoped>
.pageBody {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
}

.sideBar {
  flex: 0 0 clamp(220px, 24vw, 320px);
  position: sticky;
  top: 66px;
  max-height: calc(100vh - 82px);
  overflow-y: auto;
}

.convertPart {
  flex: 1 1 0;
  min-width: 0;
}

.main {
  background-color: var(--aoe-panel-bg);
  min-height: 50vh;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.aoeHeader {
  background-size: cover;
  background-position: center;
  border-bottom: 3px ridge var(--aoe-gold-dark);
}

.aoeToolbar {
  background: rgba(0, 0, 0, 0.35);
}

.aoeLogo {
  font-family: var(--aoe-font);
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: var(--aoe-gold);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  text-align: center;
  padding-left: 3rem;
}

.aoeTabs {
  background: linear-gradient(180deg, #fff3c4, #ffe082);
  color: var(--aoe-blue);
  border: 3px ridge var(--aoe-gold-dark);
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
  font-weight: 700;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  width: min(90vw, 28rem);
  padding: 0.6rem 1rem;
  text-align: center;
  color: #fff;
  border: 3px ridge var(--aoe-gold-dark);
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  pointer-events: none;
  word-break: break-word;
}

.toastTitle {
  font-family: var(--aoe-font);
  font-size: 1.5rem;
  color: var(--aoe-gold);
}

.errorToast {
  background-color: rgba(140, 15, 15, 0.95);
}

.infoToast {
  background-color: rgba(28, 42, 115, 0.95);
}

/* Écrans étroits : la liste de fichiers passe au-dessus du contenu */
@media (max-width: 899px) {
  .pageBody {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem;
  }

  .sideBar {
    flex: none;
    position: static;
    max-height: 40vh;
  }

  .aoeLogo {
    padding-left: 0;
    text-align: left;
  }
}
</style>
