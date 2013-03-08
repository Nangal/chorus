require_relative 'dataset_column'

class SqlResult
  attr_reader :columns, :rows
  attr_accessor :schema, :warnings

  def initialize(options = {})
    @columns = []
    @rows = []
    @warnings = options[:warnings] || []
    @result_set = options[:result_set]
    load_from_result_set if @result_set
  end

  def canceled?
    warnings.any? { |message| message =~ /cancel(ed|ing)/i }
  end

  def hashes
    rows.map do |row|
      hash = {}
      columns.each_with_index do |column, i|
        hash[column.name] = row[i]
      end
      hash
    end
  end

  def add_column(name, type)
    @columns << dataset_column_class.new(:name => name, :data_type => type)
  end

  def add_row(row)
    @rows << row
  end

  def add_rows(rows)
    @rows.concat(rows)
  end

  private

  def column_string_value(index)
    type = @result_set.meta_data.column_type_name(index+1)

    # greenplum float8#to_s gives us weird rounded numbers
    if type == "float8"
      @result_set.get_object(index+1).to_s
    else
      @result_set.get_string(index+1)
    end
  end

  def load_from_result_set
    meta_data = @result_set.meta_data
    column_count = meta_data.column_count

    column_count.times do |i|
      add_column(
        meta_data.get_column_name(i+1),
        meta_data.column_type_name(i+1)
      )
    end

    while @result_set.next
      row = (0...column_count).map do |i|
         column_string_value(i)
      end

      add_row(row)
    end
  end
end
