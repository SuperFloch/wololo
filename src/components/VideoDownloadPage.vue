<template>
    <div class="downloadPage aoe-page">
        <div class="aoe-title">Download a Youtube video from URL</div>
        <div class="downloadBody">
            <div class="formCol">
                <q-input label="Url" class="aoe-input" color="indigo-10" v-model="videoUrl" clearable></q-input>
                <div class="btnRow">
                    <q-btn color="indigo-10" class="aoe-btn" glossy icon="movie" @click="downloadVideo" :disable="!videoUrl || isConverting" label="Download"></q-btn>
                    <q-btn color="indigo-10" class="aoe-btn" glossy icon="audiotrack" @click="downloadAudio" :disable="!videoUrl || isConverting" label="Audio Only"></q-btn>
                </div>
            </div>
            <div class="aoe-monk">
                <MonkAnimation :converting="isConverting" :ready="videoUrl !== ''" ref="monk" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="aoe-actions" v-show="resultUrl !== null">
            <div class="aoe-success">Download Succeded !</div>
            <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultUrl" :download="'result.'+outFormat"></q-btn>
        </div>
    </div>
</template>
<script>
import MonkAnimation from './MonkAnimation.vue';
export default {
    components: {
        MonkAnimation
    },
    props:{
        muted: Boolean
    },
    data() {
        return {
            videoUrl: '',
            isConverting: false,
            resultUrl: null,
            outFormat: 'mp4'
        }
    },
    emits:['error', 'output'],
    methods: {
        downloadVideo() {
            this.download('video:download', 'mp4')
        },
        downloadAudio() {
            this.download('audio:download', 'mp3')
        },
        download(channel, format) {
            this.isConverting = true;
            this.resultUrl = null;
            this.outFormat = format
            window.ipcRenderer.invoke(channel, { url: this.videoUrl }).then((result) => {
                if (result.error) {
                    this.$emit('error', result.error);
                    this.$refs.monk.deathSound();
                }else{
                    this.resultUrl = result.data;
                }
                this.$emit('output')
            }).catch(err => {
                this.$emit('error', err.message);
                this.$refs.monk.deathSound();
            }).finally(() => {
                this.isConverting = false;
            });
        }
    }
}
</script>
<style scoped>
.downloadBody {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: center;
}

.formCol {
    flex: 1 1 16rem;
    min-width: 0;
}

.btnRow {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 0.75rem;
}
</style>
