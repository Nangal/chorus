chorus.dialogs.Account = chorus.dialogs.Base.extend({
    className:"instance_account",
    translationKeys: {
        cancel: '',
        body: ''
    },

    events:{
        "submit form":"save"
    },

    additionalContext: function() {
        return {
            translationKeys: this.translationKeys,
            translationValues: {}
        };
    },

    makeModel:function () {
        this._super("makeModel", arguments);
        this.model.bind("saved", this.saved, this);
    },

    save:function (e) {
        e.preventDefault();
        this.model.save({
            dbUserName:this.$("input[name=dbUserName]").val(),
            dbPassword:this.$("input[name=dbPassword]").val()
        });
    },

    saved:function () {
        this.closeModal();
    }
});