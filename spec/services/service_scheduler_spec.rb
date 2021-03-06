require 'spec_helper'
require 'service_scheduler'

class ServiceScheduler
  def job_named(job)
    @@manager.events.find { |event|
      event.job == job
    }
  end
end

module Clockwork
  def self.config
    @@manager.config
  end

  class Manager
    attr_reader :events, :config
  end

  class Event
    attr_reader :period
  end
end

describe ServiceScheduler do
  let(:job_scheduler) { ServiceScheduler.new }
  describe "DataSourceStatusChecker.check_all" do
    it "runs every ChorusConfig.instance['instance_poll_interval_minutes'] minutes" do
      job_scheduler.job_named('DataSourceStatusChecker.check_all').period.should == ChorusConfig.instance['instance_poll_interval_minutes'].minutes
    end

    it "enqueues the 'DataSourceStatusChecker.check_all' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("DataSourceStatusChecker.check_all")
      job_scheduler.job_named('DataSourceStatusChecker.check_all').run(Time.current)
    end
  end

  describe "CsvFile.delete_old_files!" do
    it "runs every ChorusConfig.instance['delete_unimported_csv_files_interval_hours'] hours" do
      job_scheduler.job_named('CsvFile.delete_old_files!').period.should == ChorusConfig.instance['delete_unimported_csv_files_interval_hours'].hours
    end

    it "enqueues the 'CsvFile.delete_old_files!' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("CsvFile.delete_old_files!")
      job_scheduler.job_named('CsvFile.delete_old_files!').run(Time.current)
    end
  end

  describe "OrphanCleaner.clean" do
    it "runs every 24 hours" do
      job_scheduler.job_named('OrphanCleaner.clean').period.should == 24.hours
    end

    it "enqueues the 'OrphanCleaner.clean' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("OrphanCleaner.clean")
      job_scheduler.job_named('OrphanCleaner.clean').run(Time.current)
    end
  end

  describe "SolrIndexer.refresh_external_data" do
    it "runs every ChorusConfig.instance['reindex_search_data_interval_hours'] hours" do
      job_scheduler.job_named('SolrIndexer.refresh_external_data').period.should == ChorusConfig.instance['reindex_search_data_interval_hours'].hours
    end

    it "enqueues the 'SolrIndexer.refresh_external_data' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("SolrIndexer.refresh_external_data")
      job_scheduler.job_named('SolrIndexer.refresh_external_data').run(Time.current)
    end
  end

  describe "Tag.reset_all_counters" do
    it "runs every ChorusConfig.instance['reset_counter_cache_interval_hours'] hours" do
      job_scheduler.job_named('Tag.reset_all_counters').period.should == ChorusConfig.instance['reset_counter_cache_interval_hours'].hours
    end

    it "enqueues the 'Tag.reset_all_counters' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("Tag.reset_all_counters")
      job_scheduler.job_named('Tag.reset_all_counters').run(Time.current)
    end
  end

  describe "Session.remove_expired_sessions" do
    it "runs every ChorusConfig.instance['clean_expired_sessions_interval_hours'] minutes" do
      job_scheduler.job_named('Session.remove_expired_sessions').period.should == ChorusConfig.instance['clean_expired_sessions_interval_hours'].hours
    end

    it "enqueues the 'Session.remove_expired_sessions' job in QC" do
      mock(QC.default_queue).enqueue_if_not_queued("Session.remove_expired_sessions")
      job_scheduler.job_named('Session.remove_expired_sessions').run(Time.current)
    end
  end

  describe "JobBoss" do
    it "runs every minute" do
      job_scheduler.job_named('JobBoss.run').period.should == 1.minute
    end

    it "runs in the same thread" do
      mock(JobBoss).run
      job_scheduler.job_named('JobBoss.run').run(Time.current)
    end
  end

  describe "SeviceScheduler.run" do
    it "builds a ServiceScheduler and then runs it starts the clockwork" do
      built = false
      any_instance_of(ServiceScheduler) do |js|
        mock(js).run
        built = true
      end
      ServiceScheduler.run
      built.should be_true
    end
  end
end

describe QC do
  let!(:timestamp) { Time.current }
  before do
    stub(Time).current { timestamp }
  end

  it "adds a timestamps to the data" do
    mock(Scrolls).log(hash_including({:timestamp => timestamp.to_s})).times(any_times)
    QC.log(:message => "Rome is burning")
  end

  it "adds timestamps to clockwork logs" do
    mock(Clockwork.config[:logger]).info("#{timestamp.to_s}: hello")
    Clockwork.log("hello")
  end
end
