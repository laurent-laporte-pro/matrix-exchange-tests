# matrix-exchange-tests

Test matrix exchange formats and libraries, end-to-end from disk storage to web app UI.

## Content

Folder `front` contains a small react web application.
Folder `back` contains a small python fastapi backend.

Tested formats:
- HDF5 for storage
- JSON for transfer back -> front
- apache arrow for transfer back -> front

## Run

### Back
In `back` directory:
first install dependencies
```shell
pip install -r requirements.txt
```
then run the app
```shell
python -m uvicorn antares.main:app [--reload]
```

### Front

In `front` directory:
first install dependencies
```shell
npm install
```
then run the app
```shell
npm run start
```
