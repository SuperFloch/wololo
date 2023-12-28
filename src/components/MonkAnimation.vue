<template>
    <div>
        <img src="img/heal.webp">
    </div>
    <div class="hidden">
        <audio src="sound/5031.wav" ref="monastery"></audio>
        <audio src="sound/5494.wav" ref="convert1" loop></audio>
        <audio src="sound/5495.wav" ref="convert2" loop></audio>
        <audio src="sound/5497.wav" ref="heal"></audio>
    </div>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props:{
        ready: Boolean,
        converting: Boolean
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
    }
})
</script>
