<template>
    <div class="p-relative border" style="border-image:url('img/border.png') 40">
        <img :src="computeSrc" v-if="computeMediaType == 'img'" ref="img" @load="onLoad">
        <video :src="computeSrc" v-if="computeMediaType == 'video'" muted @mouseover="onHover($event)" ref="videoPlayer" @loadeddata="onLoad($event)"></video>
        <div class="overlay absolute-center" :class="{'hidden': !isConverting}"></div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props:{
        src: String,
        forceVideo: {
            type: Boolean,
            default: false
        }
    },
    emits: ['click','change','load'],
    data: function(){
        return {
            isConverting: false,
            imgFormats: ['jpg','gif','png','webp'],
            videoFormats: ['webm','avi','mp4', 'mov'],
            realSrc: '',
            isTiny: false
        }
    },
    mounted: function(){
        this.realSrc = this.src;
    },
    methods:{
        isVideoFormat(fp){
            if(fp.split('data:video/').length > 1) return true;
            return this.videoFormats.includes(fp.split(".")[1]);
        },
        isImgFormat(fp){
            if(fp.split('data:image/').length > 1) return true;
            return this.imgFormats.includes(fp.split(".")[1]);
        },
        onHover(e){
            if(e.target.paused){
                e.target.play();
            }
        },
        getFile(){
            if(this.computeMediaType == 'img'){
                return this.$refs.img
            }else{
                return this.$refs.videoPlayer
            }
        },
        isSquare(){
            if(this.isVideoFormat){
                return false
            }
            return this.$refs.img.width = this.$refs.img.height;
        },
        onLoad(e){
            this.$emit('load')
        }
    },
    computed: {
        computeMediaType(){
            return this.isImgFormat(this.realSrc) ? 'img' : (this.isVideoFormat(this.realSrc) ? 'video' : '');
        },
        computeNeedConversion(){
            var type = this.computeMediaType;
            if(type == 'img'){
                return  this.realSrc.split(".")[1] != "webp" || this.forceVideo
            }else if(type == "video"){
                return  this.realSrc.split(".")[1] != "webm"
            }else {
                return false;
            }
        },
        computeSrc(){
            return this.realSrc ?? this.src;
        }
    },
    watch: { 
        src: function(newVal, oldVal) { // watch it
            this.realSrc = newVal;
        }
    }
})
</script>
<style scoped>
.overlay{
    width:100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    transform: none;
}
.border{
    border-width: 30px;
    border-style: solid;
    width: fit-content;
}
img, video{
    display: block;
}
</style>
