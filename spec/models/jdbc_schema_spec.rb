require 'spec_helper'

describe JdbcSchema do
  describe '#data_source' do
    let(:schema) {
      JdbcSchema.create!(:name => 'test_schema', :data_source => data_sources(:jdbc))
    }

    it 'returns the schemas parent' do
      schema.reload.data_source.should == data_sources(:jdbc)
    end
  end

  describe 'validations' do
    let(:schema) { JdbcSchema.new(:name => 'test_schema', :data_source => data_sources(:jdbc)) }

    it 'requires there is a data source' do
      schema.data_source = nil
      schema.valid?.should be_false
      schema.errors_on(:data_source).should include(:blank)
    end

    it 'requires a name' do
      schema.name = nil
      schema.valid?.should be_false
      schema.errors_on(:name).should include(:blank)
    end

    it 'requires a unique name per data source' do
      schema.save!
      new_schema = JdbcSchema.new(:name=> 'test_schema', :data_source => data_sources(:jdbc))
      new_schema.valid?.should be_false
      new_schema.errors_on(:name).should include(:taken)

      new_schema.data_source = FactoryGirl.build(:jdbc_data_source)
      new_schema.valid?.should be_true
    end

  end

  it_behaves_like 'a subclass of schema' do
    let(:schema) { schemas(:jdbc) }
  end

  it_behaves_like 'a soft deletable model' do
    let(:model) { schemas(:jdbc)}
  end
end
