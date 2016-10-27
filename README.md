Smell Pittsburgh Rails Server
=============================

A simple API for sending and receiving Smell Reports, powered by Rails.

Runs on **rails 4.2.6** using **ruby v2.2.1**.

## Requesting Smell Reports

Issue the following request to receive smell reports:

    curl http://localhost:3000/api/v1/smell_reports

Responses will look like:

```json
[
    {
	    "latitude" : 40.4406248,
		"longitude" : -79.9958864,
		"smell_value" : 1,
		"smell_description" : "Description of the smell",
		"feelings_symptoms" : "Symptoms or feelings associated with the smell",
		"created_at" : "2016-03-29T15:49:53.000Z"
	},
	...
]
```

By default, this will retrieve all smell reports (for now). Plans for future releases:

* Query by latitude/longitude
* Sorting results

## Uploading new Smell Reports to the server

You can upload new smell reports using the following form:

```json
{
	"user_hash" : "someuniquehash",
    "latitude" : 40.4406248,
	"longitude" : -79.9958864,
	"smell_value" : 1,
	"smell_description" : "Description of the smell",
	"feelings_symptoms" : "Symptoms or feelings associated with the smell",
  "submit_achd_form" : true
}
```

Then issue the curl command:

    curl -X POST -H "Content-Type:application/json" http://localhost:3000/api/v1/smell_reports -d @smell_report.json

The fields **user_hash**, **latitude**, **longitude**, and **smell_value** are required fields.
