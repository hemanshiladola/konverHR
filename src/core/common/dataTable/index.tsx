// index.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table } from "antd";
import type { DatatableProps } from "../../data/types";

// Extend the props to include pageSize
interface ExtendedDatatableProps<T extends object> extends DatatableProps<T> {
  pageSize?: number;
}

function Datatable<T extends object = object>({
  columns,
  dataSource,
  Selection,
  pageSize = 10,
}: ExtendedDatatableProps<T>) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selections, setSelections] = useState<boolean>(Selection ?? false);
  // const [searchText, setSearchText] = useState<string>("");
  // const [filteredDataSource, setFilteredDataSource] = useState<T[]>(dataSource);

  // Memoize the filtered data to prevent recalculation on every render
  // const filteredData = useMemo(() => {
  //   if (!searchText) return dataSource;
  //   return dataSource.filter((record: T) =>
  //     Object.values(record).some((field) =>
  //       String(field).toLowerCase().includes(searchText.toLowerCase()),
  //     ),
  //   );
  // }, [dataSource, searchText]);

  useEffect(() => {
    setSelections(Selection ?? false);
  }, [Selection]);

  // Memoize the row selection configuration
  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
    }),
    [selectedRowKeys],
  );

  // Memoize pagination configuration
  // Added pageSize as a dependency so the table updates when the dropdown changes
  const paginationConfig = useMemo(
    () => ({
      locale: { items_per_page: "" },
      nextIcon: <i className="ti ti-chevron-right" />,
      prevIcon: <i className="ti ti-chevron-left" />,
      pageSize: pageSize,
      showSizeChanger: false, // We hide the AntD default because we added a custom one in the header
      showTotal: (total: number, range: [number, number]) =>
        `Showing ${range[0]} - ${range[1]} of ${total} entries`,
    }),
    [pageSize],
  );

  // Memoize pagination config with selection
  const paginationConfigWithSelection = useMemo(
    () => ({
      ...paginationConfig,
      showTotal: (total: number, range: [number, number]) =>
        `Showing ${range[0]} - ${range[1]} of ${total} entries`,
    }),
    [paginationConfig],
  );

  // Debounced search handler
  // const handleSearch = useCallback((value: string) => {
  //   setSearchText(value);
  // }, []);

  // Memoize the search input change handler
  // const handleSearchChange = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     handleSearch(e.target.value);
  //   },
  //   [handleSearch],
  // );

  // Update filtered data when search text changes
  // useEffect(() => {
  //   setFilteredDataSource(filteredData);
  // }, [filteredData]);

  return (
    <>
      {/* <div className="table-top-data">
        <div className="row p-3">
          <div className="col-sm-12 col-md-6">
            <div
              className="dataTables_length"
              id="DataTables_Table_0_length"
            ></div>
          </div>
          <div className="col-sm-12 col-md-6">
            <div
              id="DataTables_Table_0_filter"
              className="dataTables_filter text-end mb-0"
            >
              <label>
                {" "}
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search"
                  aria-controls="DataTables_Table_0"
                  value={searchText}
                  onChange={handleSearchChange}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {!Selections ? (
        <Table
          className="table datanew dataTable no-footer"
          columns={columns}
          rowHoverable={false}
          dataSource={filteredDataSource}
          pagination={paginationConfig}
        />
      ) : (
        <Table
          className="table datanew dataTable no-footer"
          rowSelection={rowSelection}
          columns={columns}
          rowHoverable={false}
          dataSource={filteredDataSource}
          pagination={paginationConfigWithSelection}
        />
      )} */}
      <div className="table-responsive custom-table">
        <Table
          className="table datanew dataTable no-footer"
          // Toggle selection based on prop
          rowSelection={selections ? rowSelection : undefined}
          columns={columns}
          rowHoverable={false}
          // Use dataSource directly (it's already filtered/sorted by DatatableKHR)
          dataSource={dataSource}
          pagination={paginationConfig}
          // scroll={{ y: "calc(100vh - 340px)" }}
        />
      </div>
    </>
  );
}

export default React.memo(Datatable) as typeof Datatable;
