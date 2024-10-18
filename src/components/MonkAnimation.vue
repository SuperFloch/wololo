<template>
    <div class="main">
        <img src="img/heal.webp" v-if="converting">
        <img src="img/heal.png" v-if="!converting">
    </div>
    <div class="hidden">
        <audio src="sound/5031.wav" ref="monastery" :muted="muted"></audio>
        <audio src="sound/5494.wav" ref="convert1" :muted="muted" loop></audio>
        <audio src="sound/5495.wav" ref="convert2" :muted="muted" loop></audio>
        <audio src="sound/5497.wav" ref="heal" :muted="muted"></audio>
        <audio src="sound/deathSounds.mp3" ref="death" :muted="muted"></audio>
    </div>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props:{
        ready: Boolean,
        converting: Boolean,
        muted: Boolean
    },
    watch:{
        converting: function(newVal, oldVal) { // watch it
            if(newVal){
                this.$refs.convert1.play();
                this.$refs.convert2.play();
            }else{
                this.$refs.convert1.pause();
                this.$refs.convert2.pause();
                this.$refs.heal.play();
            }
        },
        ready: function(newVal, oldVal){
            if(newVal){
                this.$refs.monastery.play();
            }
        }
    },
    methods:{
        deathSound(){
            this.$refs.death.currentTime = 1000;
            this.$refs.death.play();
            setTimeout(()=>{
                this.$refs.death.pause();
                this.$refs.death.currentTime = 0;
            }, 1000)

        }
    }
})
</script>
<style scoped>
.main{
    width: 100%;
    position: relative;
}
.main img{
    width: 30%;
    margin: auto;
    position: absolute;
    left: 0;
    right: 0;
    transform: scaleX(-1);
}
</style>
