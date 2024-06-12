# apply dedup configuration
$ fluvio topic apply --config topic-config.yaml

# produce
$ fluvio produce dedup --key-separator ":"
1: one
1: one
2: two

# consume
$ fluvio consume dedup -B -k
1: one
2: two