describe("chorus.views.HdfsEntrySidebar", function() {
    beforeEach(function() {
        this.view = new chorus.views.HdfsEntrySidebar({rootPath: "/foo", instanceId: 123});
    });

    describe("#render", function() {
        context("when the model is a directory", function() {
            beforeEach(function() {
                this.hdfsEntry = fixtures.hdfsEntryDir();
                chorus.PageEvents.broadcast("hdfs_entry:selected", this.hdfsEntry);
            });

            itHasTheRightDefaultBehavior(false);

            it("does not have a link to add a note", function() {
                expect(this.view.$("a.dialog.add_note")).not.toExist();
            });
        });

        context("when the model is a non-binary file", function() {
            beforeEach(function() {
                // set up page to catch launch dialog click
                var page = new chorus.pages.Base();
                $(page.el).append(this.view.el);
                chorus.bindModalLaunchingClicks(page);

                this.modalSpy = stubModals();

                this.hdfsEntry = fixtures.hdfsEntryFile({name: "my_file.sql", isBinary: false});
                chorus.PageEvents.broadcast("hdfs_entry:selected", this.hdfsEntry);
            });

            itHasTheRightDefaultBehavior(true);

            describe("clicking the add a note link", function() {
                beforeEach(function() {
                    this.view.$("a.dialog.add_note").click();

                    chorus.modal.$("textarea").text("test comment").change();
                    chorus.modal.$("button.submit").submit();
                });

                it("makes a request to the correct URL", function() {
                    // testing this URL explicitly because tracking the URL through encodings has proven to be difficult
                    expect(this.server.lastCreate().url).toBe("/edc/comment/hdfs/123%7C%2Ffoo%2Fmy_file.sql");
                });
            });

            describe("clicking the external table link", function() {
                beforeEach(function() {
                    this.view.$("a.external_table").click();
                    this.csv = new chorus.models.CsvHdfs(fixtures.csvImport({instanceId: "123", path: "/foo/my_file.sql", content: "hello\nworld"}).attributes);
                    this.server.completeFetchFor(this.csv);
                });

                it("launches the right dialog", function() {
                    expect(this.modalSpy).toHaveModal(chorus.dialogs.CreateExternalTableFromHdfs)
                    expect(chorus.modal.csv.get("encodedPath")).toBe("%2Ffoo%2Fmy_file.sql");
                });
            })
        });

        context("when the model is a binary file", function() {
            beforeEach(function() {
                // set up page to catch launch dialog click
                var page = new chorus.pages.Base();
                $(page.el).append(this.view.el);
                chorus.bindModalLaunchingClicks(page);

                this.modalSpy = stubModals();

                this.hdfsEntry = fixtures.hdfsEntryFile({name: "my_file.exe", isBinary: true});
                chorus.PageEvents.broadcast("hdfs_entry:selected", this.hdfsEntry);
            });

            it("does not have a create external table link", function() {
                expect(this.view.$("a.external_table")).not.toExist();
            })

        })
    })

    function itHasTheRightDefaultBehavior(withActivities) {
        it("should display the file name", function() {
            expect(this.view.$(".info .name").text()).toBe(this.hdfsEntry.get("name"));
        });

        it("should display the last updated timestamp", function() {
            var when = chorus.helpers.relativeTimestamp(this.hdfsEntry.get("lastModified"));
            expect(this.view.$(".info .last_updated").text().trim()).toMatchTranslation("hdfs.last_updated", {when: when});
        });

        if (withActivities) {
            it("shows the activity stream", function() {
                expect(this.view.$(".tab_control")).not.toHaveClass("hidden")
            });

            it("fetches the activity list", function() {
                expect(this.view.activityList.collection).toHaveBeenFetched();
            });

            it("re-fetches when memo:added is broadcast with hdfs", function() {
                this.server.reset();
                chorus.PageEvents.broadcast("memo:added:hdfs");
                expect(this.view.activityList.collection).toHaveBeenFetched();
            })

            it("re-fetches when csv_import:started is broadcast", function() {
                this.server.reset();
                chorus.PageEvents.broadcast("csv_import:started");
                expect(this.view.activityList.collection).toHaveBeenFetched();
            })
        } else {
            it("does not fetch the activity list", function() {
                expect(this.view.activityList).toBeUndefined();
            });

            it("hides the activity stream", function() {
                expect(this.view.$(".tab_control")).toHaveClass("hidden")
            });
        }
    }
})