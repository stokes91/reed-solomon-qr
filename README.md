# reed-solomon-qr

QR Codes include some number of error correction codes amended to the data within the encoding region.

If you're looking to generate or read these blocks of data, this code will save you the trouble of porting some of the more tedious code of the QR spec from another library.

## Modestly fast

Try out examples/version-one-qr to see how fast it is on your machine. A fairly small cloud instance can achieve 22K repairs per second for a Version 1 QR code (with 8 randomly placed errors), or approximately 2K repairs per second of the popular RS(255, 223) (with 15 randomly placed errors).

## Succinct and math focused

The code is written in a way that minimizes the use of tiny performance boosts in favor of clarity. It is designed to accept garbage data and not throw errors, but rather return a true on failure, fals-y if the buffer was repaired, or false if already pristine before decode.

## Also Free

Licensed under Apache 2.0

