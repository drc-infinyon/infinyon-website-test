# create materialized view
$ fluvio materialized-view create --config mv.yaml

# view materialized view current state
$ fluvio state avg_bus_speed
{
    [
        {
          "vehicle_id": "123",
          "avg_speed": 10.0
        },
        {
          "vehicle_id": "456",
          "avg_speed": 35.0
        }
    ]
}