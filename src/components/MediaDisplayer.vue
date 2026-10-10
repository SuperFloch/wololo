<template>
    <div class="mediaBox" :class="{ fitted: fit }" :style="boxStyle">
        <img class="media" :src="src" v-if="mediaType == 'img'" ref="img" @load="onLoad">
        <video class="media" :src="src" v-else-if="mediaType == 'video'" :muted="muted" @mouseover="onHover" ref="videoPlayer" @loadeddata="onLoad" :loop="loop" @timeupdate="onTime" @click="toggle"></video>
        <!-- Calque place exactement sur le media (hors bordure decorative) -->
        <div class="overlay" v-if="$slots.default">
            <slot></slot>
        </div>
    </div>
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
        },
        // Le media occupe le maximum de place dans son parent (qui doit etre en position: relative)
        fit: {
            type: Boolean,
            default: false
        }
    },
    emits: ['load'],
    data: function () {
        return {
            // Dimensions reelles du media (et non celles affichees)
            width: 0,
            height: 0,
            fitWidth: 0,
            fitHeight: 0
        }
    },
    computed: {
        mediaType() {
            if (this.src?.startsWith('data:image/')) return 'img'
            if (this.src?.startsWith('data:video/')) return 'video'
            return ''
        },
        boxStyle() {
            return this.fit ? { width: this.fitWidth + 'px', height: this.fitHeight + 'px' } : {}
        }
    },
    watch: {
        width: 'updateFit',
        height: 'updateFit'
    },
    mounted() {
        if (this.fit) {
            this.observer = new ResizeObserver(this.updateFit)
            this.observer.observe(this.$el.parentElement)
        }
    },
    beforeUnmount() {
        this.observer?.disconnect()
    },
    methods: {
        // Plus grande taille respectant le ratio du media dans l'espace disponible du parent
        updateFit() {
            const parent = this.$el.parentElement
            if (!this.fit || !parent || !this.width || !this.height) return
            const border = parseFloat(getComputedStyle(this.$el).getPropertyValue('--media-border')) || 0
            const scale = Math.max(0, Math.min(
                (parent.clientWidth - 2 * border) / this.width,
                (parent.clientHeight - 2 * border) / this.height
            ))
            this.fitWidth = Math.floor(this.width * scale + 2 * border)
            this.fitHeight = Math.floor(this.height * scale + 2 * border)
        },
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
            this.updateFit()
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
.mediaBox {
    position: relative;
    display: flex;
    justify-content: center;
    max-width: 100%;
}

/* Mode "fit" : centre dans le parent, taille imposee en pixels */
.mediaBox.fitted {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: none;
}

.media {
    display: block;
    box-sizing: border-box;
    max-width: 100%;
    max-height: var(--media-max-h, 40vh);
    border-image: url('/img/border.png') 40;
    border-width: var(--media-border);
    border-style: solid;
    background-color: rgba(0, 0, 0, 0.25);
}

.fitted .media {
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: fill;
}

.overlay {
    position: absolute;
    inset: var(--media-border);
}
</style>
