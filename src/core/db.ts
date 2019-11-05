import mongoose from "mongoose";

const connect = async () => {
    if (![1, 2].includes(mongoose.connection.readyState)) {
        await mongoose.connect(`${process.env.db_connection_string}/${process.env.db_name}`, {
            autoIndex: true,
            useNewUrlParser: true,
        });
    }
    return mongoose;
};

export default connect;
