---
title: Polars library
description: Stateful Services Polar
weight: 90
---


The [polars](https://pola.rs) are built-in adaptors that can be used to perform data manipulation and transformation on dataframes.  Polars adaptor is enabled for operators that can access dataframe states and you don't need to add any flag in your operator definition.

The polars [rust api](https://docs.rs/polars/0.36.2/polars/index.html) can be used when dataframe state is available.  For example, following snippet show performing polar operator on state that return dataframe.  Please refer to states [states](/docs/stateful-services/states) section for more details.

In here, `count_per_word` is a state that returns a [dataframe](https://docs.rs/polars/latest/polars/frame/struct.DataFrame.html) and assign to variable `df`.  Then any dataframe operation can be performed on `df` variable. 

```yaml
- operator: map
  run: |
    fn map_words_to_occurrence(key: String) -> Result<String, String> {
        use polars::prelude::{col,lit,IntoLazy};

        let df = count_per_word();
        let val = df
            .clone()
            .lazy()
            .filter(col("id").eq(lit(key.clone())))
            .collect()
            .expect("parse");
        println!("{:#?}", val);

        if let Some(count) = val.column("occurrences").unwrap().i32().unwrap().get(0) {
            Ok(format!("key: {} count: {}",key,count))
        } else {
            Ok(format!("key: {} not found",key))
        }
    }
```