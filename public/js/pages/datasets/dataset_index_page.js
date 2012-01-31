(function() {
    var breadcrumbsView = chorus.views.ModelBoundBreadcrumbsView.extend({
        getLoadedCrumbs: function() {
            return [
                {label: t("breadcrumbs.home"), url: "#/"},
                {label: t("breadcrumbs.workspaces"), url: '#/workspaces'},
                {label: this.model.displayShortName(), url: this.model.showUrl()},
                {label: t("breadcrumbs.workspaces_data")}
            ];
        }
    });

    chorus.pages.DatasetIndexPage = chorus.pages.Base.extend({
        setup: function(workspaceId) {
            this.workspace = new chorus.models.Workspace({id: workspaceId});
            this.workspace.onLoaded(this.workspaceLoaded, this);
            this.workspace.fetch();
            this.breadcrumbs = new breadcrumbsView({model: this.workspace});

            this.collection = new chorus.collections.DatasetSet([], {workspaceId: workspaceId});
            this.collection.sortAsc("objectName");

            this.subNav = new chorus.views.SubNav({workspace: this.workspace, tab: "datasets"});
            this.mainContent = new chorus.views.MainContentList({
                modelClass: "Dataset",
                collection: this.collection,
                model: this.workspace
            });

            this.sidebar = new chorus.views.DatasetListSidebar();

            this.mainContent.content.forwardEvent("dataset:selected", this.sidebar);
            this.mainContent.content.bind("dataset:selected", function(dataset) {
                this.model = dataset;
            }, this);
        },

        workspaceLoaded: function() {
            this.account = this.workspace.sandbox().instance().accountForCurrentUser();
            this.account.onLoaded(this.checkAccount, this);
            this.account.fetch();

        },

        checkAccount: function() {
            if (this.account.get('id')) {
                this.collection.fetch();
            } else {
                if (chorus.session.sandboxPermissionsCreated[this.workspace.get("id")]) {
                    this.collection.fetch();
                }
                else {
                    this.dialog = new chorus.dialogs.WorkspaceInstanceAccount({model: this.account, pageModel: this.workspace});
                    this.dialog.launchModal();
                    this.collection.loaded = true;
                    this.collection.trigger('reset');
                    this.account.bind('saved', function() {
                        this.collection.fetch();
                    }, this);
                    chorus.session.sandboxPermissionsCreated[this.workspace.get("id")] = true;
                }
            }
        }
    });
})();