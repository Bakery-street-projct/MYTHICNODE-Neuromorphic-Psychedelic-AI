import logging

class DataLogger:
    def __init__(self, log_file="data.log"):
        logging.basicConfig(filename=log_file, level=logging.INFO)

    def log(self, data):
        logging.info(data)

if __name__ == "__main__":
    logger = DataLogger()
    logger.log("Neuromorphic system started")