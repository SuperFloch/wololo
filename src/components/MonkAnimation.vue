<template>
    <div class="monkBox">
        <img src="img/heal.webp" v-if="converting" alt="Monk converting">
        <img src="img/heal.png" v-else alt="Monk">
        <div class="hidden">
            <audio src="sound/5031.wav" ref="monastery" :muted="muted"></audio>
            <audio src="sound/5494.wav" ref="convert1" :muted="muted" loop></audio>
            <audio src="sound/5495.wav" ref="convert2" :muted="muted" loop></audio>
            <audio src="sound/5497.wav" ref="heal" :muted="muted"></audio>
            <audio src="sound/deathSounds.mp3" ref="death" :muted="muted"></audio>
        </div>
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
        converting: function(newVal) { // watch it
            if(newVal){
                this.$refs.convert1.play();
                this.$refs.convert2.play();
            }else{
                this.$refs.convert1.pause();
                this.$refs.convert2.pause();
                this.$refs.heal.play();
            }
        },
        ready: function(newVal){
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
.monkBox {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.monkBox img {
    height: clamp(96px, 22vh, 200px);
    width: auto;
    image-rendering: pixelated;
    transform: scaleX(-1);
    filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.6));
}
</style>
