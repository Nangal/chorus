describe("chorus.models.Workspace", function() {
    var models = chorus.models;
    beforeEach(function() {
        fixtures.model = 'Workspace';
        this.model = new models.Workspace();
    });

    it("has the correct urlTemplate", function() {
        expect(this.model.urlTemplate).toBe("workspace/{{id}}");
    });

    describe("#defaultIconUrl", function() {
        it("links to the correct url when active", function(){
            this.model.set({active: true});
            expect(this.model.defaultIconUrl()).toBe("/images/workspace-icon-large.png");
        });

        it("links to the correct url when archived", function(){
            this.model.set({active: false});
            expect(this.model.defaultIconUrl()).toBe("/images/workspace-archived-icon-large.png");
        });
    });

    describe("#customIconUrl", function() {
        it("links to the original url by default", function(){
            this.model.set({id: 5});
            expect(this.model.customIconUrl()).toBe("/edc/workspace/5/image?size=original");
        });

        it("links to the requested size", function(){
            this.model.set({id: 5});
            expect(this.model.customIconUrl({size: 'profile'})).toBe("/edc/workspace/5/image?size=profile");
        });
    });

    describe("#owner", function() {
        beforeEach(function() {
            this.model.set({owner: "jhenry", ownerFullName: "John Henry"})
        });

        it("returns a new User with the right username and fullName", function() {
            var owner = this.model.owner();
            expect(owner.get("fullName")).toBe("John Henry");
            expect(owner.get("userName")).toBe("jhenry");
        });

        it("doesn't automatically fetch the User", function(){
            var numberOfServerRequests = this.server.requests.length;
            this.model.owner();
            expect(this.server.requests.length).toBe(numberOfServerRequests);
        });
    });

    describe("#performValidation", function() {
        beforeEach(function() {
            spyOn(this.model, "require").andCallThrough();
        });

        it("should return a truthy value for a valid workspace", function() {
            this.model.set(fixtures.modelFor('fetch'));
            expect(this.model.performValidation()).toBeTruthy();
        });

        it("requires name", function() {
            this.model.performValidation();
            expect(this.model.require).toHaveBeenCalledWith("name");
        });
    });
});
