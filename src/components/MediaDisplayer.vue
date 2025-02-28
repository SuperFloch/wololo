<template>
    <img :src="computeSrc" v-if="computeMediaType == 'img'" ref="img" @load="onLoad">
    <video :src="computeSrc" v-if="computeMediaType == 'video'" :muted="muted" @mouseover="onHover($event)" ref="videoPlayer" @loadeddata="onLoad($event)" :loop="loop" @timeupdate="onTime" @click="toggle"></video>
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
        start: {
            type: Number,
            default: 0
        },
        end: {
            type: Number,
            default: 100
        }
    },
    emits: ['click', 'change', 'load'],
    data: function () {
        return {
            imgFormats: ['jpg', 'gif', 'png', 'webp', 'svg'],
            videoFormats: ['webm', 'avi', 'mp4', 'mov'],
            realSrc: '',
            isTiny: false,
            width: 0,
            height: 0
        }
    },
    mounted: function () {
        this.realSrc = this.src;
    },
    methods: {
        isVideoFormat(fp) {
            if (fp.split('data:video/').length > 1) return true;
            return this.videoFormats.includes(fp.split(".")[1]);
        },
        isImgFormat(fp) {
            if (fp.split('data:image/').length > 1) return true;
            return this.imgFormats.includes(fp.split(".")[1]);
        },
        onHover(e) {
            if (e.target.paused && this.autoplay) {
                e.target.play();
            }
        },
        getFile() {
            if (this.computeMediaType == 'img') {
                return this.$refs.img
            } else {
                return this.$refs.videoPlayer
            }
        },
        isSquare() {
            if (this.computeMediaType == 'video') {
                return false
            }
            return this.$refs.img.width == this.$refs.img.height;
        },
        onLoad(e) {
            if (this.computeMediaType == 'video') {
                this.width = this.$refs.videoPlayer.videoWidth
                this.height = this.$refs.videoPlayer.videoHeight
            } else {
                this.width = this.$refs.img.width
                this.height = this.$refs.img.height
            }
            this.$emit('load')
        },
        toggle() {
            if (this.computeMediaType == 'video') {
                this.$refs.videoPlayer.paused ? this.$refs.videoPlayer.play() : this.$refs.videoPlayer.pause()
            }
        },
        onTime(e) {
            if(this.$refs.videoPlayer == null) return
            const endTime = this.end / 100 * this.$refs.videoPlayer.duration
            if (this.$refs.videoPlayer.currentTime >= endTime) {
                const startTime = this.start / 100 * this.$refs.videoPlayer.duration
                this.$refs.videoPlayer.currentTime = startTime
            }
        },
        setTime(percentage) {
            if (this.computeMediaType == 'video') {
                this.$refs.videoPlayer.pause()
                this.$refs.videoPlayer.currentTime = percentage / 100 * this.$refs.videoPlayer.duration
            }
        },
        play() {
            if (this.computeMediaType == 'video') {
                this.$refs.videoPlayer.play()
            }
        },
        getDuration() {
            if (this.computeMediaType == 'video') {
                return this.$refs.videoPlayer.duration
            }
            return 0
        }
    },
    computed: {
        computeMediaType() {
            return this.isImgFormat(this.realSrc) ? 'img' : (this.isVideoFormat(this.realSrc) ? 'video' : '');
        },
        computeSrc() {
            return this.realSrc ?? this.src;
        }
    },
    watch: {
        src: function (newVal, oldVal) { // watch it
            this.realSrc = newVal;
        }
    }
})
</script>
<style scoped>
img,
video {
    min-width: 30%;
    max-width: 100%;
    max-height: 100%;
    border-image: url('/img/border.png') 40;
    border-width: 1vh;
    border-style: solid;
}
</style>
