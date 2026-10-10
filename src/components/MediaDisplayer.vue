<template>
    <img :src="src" v-if="mediaType == 'img'" ref="img" @load="onLoad">
    <video :src="src" v-else-if="mediaType == 'video'" :muted="muted" @mouseover="onHover" ref="videoPlayer" @loadeddata="onLoad" :loop="loop" @timeupdate="onTime" @click="toggle"></video>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        src: String,
        muted: {
            type: Boolean,
            default: true
        },
        autoplay: {
            type: Boolean,
            default: true
        },
        loop: {
            type: Boolean,
            default: false
        },
        // Bornes de lecture en boucle, en % de la duree
        start: {
            type: Number,
            default: 0
        },
        end: {
            type: Number,
            default: 100
        }
    },
    emits: ['load'],
    data: function () {
        return {
            // Dimensions reelles du media (et non celles affichees)
            width: 0,
            height: 0
        }
    },
    computed: {
        mediaType() {
            if (this.src?.startsWith('data:image/')) return 'img'
            if (this.src?.startsWith('data:video/')) return 'video'
            return ''
        }
    },
    methods: {
        onHover(e) {
            if (e.target.paused && this.autoplay) {
                e.target.play();
            }
        },
        getFile() {
            return this.mediaType == 'img' ? this.$refs.img : this.$refs.videoPlayer
        },
        isSquare() {
            return this.mediaType == 'img' && this.width == this.height;
        },
        onLoad() {
            if (this.mediaType == 'video') {
                this.width = this.$refs.videoPlayer.videoWidth
                this.height = this.$refs.videoPlayer.videoHeight
            } else {
                this.width = this.$refs.img.naturalWidth
                this.height = this.$refs.img.naturalHeight
            }
            this.$emit('load')
        },
        toggle() {
            const video = this.$refs.videoPlayer
            video.paused ? video.play() : video.pause()
        },
        onTime() {
            const video = this.$refs.videoPlayer
            if (video == null) return
            if (video.currentTime >= this.end / 100 * video.duration) {
                video.currentTime = this.start / 100 * video.duration
            }
        },
        setTime(percentage) {
            if (this.mediaType == 'video') {
                this.$refs.videoPlayer.pause()
                this.$refs.videoPlayer.currentTime = percentage / 100 * this.$refs.videoPlayer.duration
            }
        },
        getDuration() {
            return this.mediaType == 'video' ? this.$refs.videoPlayer.duration : 0
        }
    }
})
</script>
<style scoped>
img,
video {
    display: block;
    min-width: 30%;
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    margin: 0 auto;
    border-image: url('/img/border.png') 40;
    border-width: var(--media-border);
    border-style: solid;
    background-color: rgba(0, 0, 0, 0.25);
}
</style>
