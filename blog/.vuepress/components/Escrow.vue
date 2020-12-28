<template>
    <div class="bg">
        <p class="title">Escrow UI (devnet)</p>
        <div>
                <div class="mb-1">
                    <label for="2020-12-24-programId-escrow-alice">Program id</label>
                    <input class="display-block" type="text" id="2020-12-24-programId-escrow-alice" v-model="programId">
                </div>
                <div class="mb-1">
                    <label for="">Alice's X token account pubkey</label>
                    <input class="display-block" type="text" v-model="aliceTokenXPubkey">
                </div>
                <div class="mb-1">
                    <label for="">Amount of X token to send to escrow</label>
                    <input class="display-block" type="number" v-model="amountXTokensToSendToEscrow">
                </div>
                <div class="mb-1">
                    <label for="">Alice's Y token account pubkey</label>
                    <input class="display-block" type="text" v-model="aliceTokenYPubkey">
                </div>
                <div class="mb-1">
                    <label for="">Amount of Y tokens Alice wants for her X tokens</label>
                    <input class="display-block" type="number" v-model="amountYTokensAliceExpects">
                </div>
                <div class="mb-1">
                    <input class="cursor-pointer" type="submit" value="Reset UI" @click="resetAliceUI">
                    <input class="cursor-pointer" type="submit" value="Init escrow">
                </div>
                
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            programId: "",
            aliceTokenXPubkey: "",
            aliceTokenYPubkey: "",
            amountXTokensToSendToEscrow: 0,
            amountYTokensAliceExpects: 0
        }
    },
    methods: {
        resetAliceUI() {
            this.programId = 0;
            this.aliceTokenXPubkey = "";
            this.aliceTokenYPubkey = "";
            this.amountXTokensToSendToEscrow = 0;
            this.amountYTokensAliceExpects = 0;
        },
        initEscrow() {
            
        }
    }
}
</script>

<style lang="stylus" scoped>
    .bg
        margin 1rem 0
        padding .1rem 1rem
        border-radius 0.4rem
        background-color: #f0f4f8
        .title
            font-weight bold

    .mb-1
        margin-bottom 1rem

    .display-block
        display:block

    .cursor-pointer
        cursor: pointer
</style>
