<template>
    <div class="p-relative">
        <img :src="computeSrc" v-if="computeMediaType == 'img'">
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
    emits: ['click','change'],
    data: function(){
        return {
            isConverting: false,
            imgFormats: ['jpg','gif','png','webp'],
            videoFormats: ['webm','avi','mp4'],
            realSrc: '',
            isTiny: false
        }
    },
    mounted: function(){
        this.realSrc = this.src;
    },
    methods:{
        imageClick(){
            if(!this.isConverting && this.computeNeedConversion){
                this.isConverting = true;
                var type = this.computeMediaType;
                if(this.realSrc.split(".")[1] == 'gif' || this.forceVideo){
                    type = "video";
                }
                if(type == "img"){
                    window.ipcRenderer.invoke('img:convert:webp', {img: this.realSrc}).then((newPath)=>{
                        if(newPath){
                            this.realSrc = newPath;
                        }
                        this.isConverting = false;
                    });
                }else if(type == "video"){
                    if(this.realSrc.split(".")[1] == 'webp'){
                        window.ipcRenderer.invoke('img:getFrames', {img: this.realSrc}).then((success)=>{
                            this.realSrc = this.realSrc.split(".")[0] + ".webm";
                            this.isConverting = false;
                        });
                    }else{
                        window.ipcRenderer.invoke('img:convert:webm', {img: this.realSrc}).then((newPath)=>{
                            if(newPath){
                                this.realSrc = newPath;
                            }
                            this.isConverting = false;
                        });
                    }
                }
            }else if(this.isTiny){
                this.isConverting = true;
                window.ipcRenderer.invoke('webm:resize', {img: this.realSrc}).then((newPath)=>{
                    if(newPath){
                        this.realSrc = newPath;
                    }
                    this.isConverting = false;
                });
            }
            else{
                this.$emit('click', this.realSrc)
            }
        },
        isVideoFormat(fp){
            return this.videoFormats.includes(fp.split(".")[1]);
        },
        isImgFormat(fp){
            return this.imgFormats.includes(fp.split(".")[1]);
        },
        onHover(e){
            if(e.target.paused){
                e.target.play();
            }
        }
    },
    computed: {
        computeMediaType(){
            console.log(this.isImgFormat(this.realSrc) ? 'img' : (this.isVideoFormat(this.realSrc) ? 'video' : ''));
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
</style>
