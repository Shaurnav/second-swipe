import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import re
from datetime import datetime

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn import metrics, preprocessing
from tensorflow.keras import models, layers, utils

dtf_products = pd.read_excel("secondswipe.xlsx", sheet_name="products")
dtf_products = dtf_products[~dtf_products["categories"].isna()]
dtf_products["product"] = range(0,len(dtf_products))
dtf_products["date"] = dtf_products["title"].apply(lambda x: int(x.split("(")[-1].replace(")","").strip()) % 30
                                                             if "(" in x else np.nan)
dtf_products["date"] = dtf_products["date"].fillna(15)
dtf_users = pd.read_excel("secondswipe.xlsx", sheet_name="users").head(10000)
dtf_users["user"] = dtf_users["userId"].apply(lambda x: x-1)

dtf_users["timestamp"] = dtf_users["timestamp"].apply(lambda x: datetime.fromtimestamp(x))
dtf_users["daytime"] = dtf_users["timestamp"].apply(lambda x: 1 if 6<int(x.strftime("%H"))<20 else 0)
dtf_users["weekend"] = dtf_users["timestamp"].apply(lambda x: 1 if x.weekday() in [5,6] else 0)

dtf_users = dtf_users.merge(dtf_products[["swipeId","product"]], how="left")
dtf_users = dtf_users.rename(columns={"buy":"y"})

tags = [i.split("|") for i in dtf_products["categories"].unique()]
columns = list(set([i for lst in tags for i in lst]))
for col in columns:
    dtf_products[col] = dtf_products["categories"].apply(lambda x: 1 if col in x else 0)

fig, ax = plt.subplots(figsize=(20,5))
sns.heatmap(dtf_products==0, vmin=0, vmax=1, cbar=False, ax=ax).set_title("Products x Features")
plt.show()

dtf_users.groupby("user").count()["product"].sort_values(ascending=False).plot(
    kind="bar", color="green", title="Y by user", figsize=(20,5)).grid(axis='y')

dtf_users["y"].value_counts().sort_index().plot(kind="bar", color="green", title="Y disribution",
                                                figsize=(20,5)).grid(axis='y')
plt.show()

tmp = dtf_users.copy()
dtf_users = tmp.pivot_table(index="user", columns="product", values="y")
missing_cols = list(set(dtf_products.index) - set(dtf_users.columns))
for col in missing_cols:
    dtf_users[col] = np.nan
dtf_users = dtf_users[sorted(dtf_users.columns)]

fig, ax = plt.subplots(figsize=(20,5))
sns.heatmap(dtf_users.isnull(), vmin=0, vmax=1, cbar=False, ax=ax).set_title("Users x Products")
plt.show()

dtf_context["liked"].value_counts().plot(kind="barh", color="green", title="Liked (count)",
                                         figsize=(5,3)).grid(axis='x')
plt.show()

dtf_context["amount"].value_counts().plot(kind="barh", color="green", title="Amount (count)",
                                         figsize=(5,3)).grid(axis='x')
plt.show()

dtf_context["time"].value_counts().plot(kind="barh", color="green", title="Time (count)",
                                         figsize=(5,3)).grid(axis='x')
plt.show()

dtf_users = pd.DataFrame(preprocessing.MinMaxScaler(feature_range=(0.5,1)).fit_transform(dtf_users.values),
                         columns=dtf_users.columns, index=dtf_users.index)

split = int(0.8*dtf_users.shape[1])
split

# Train
dtf_train = dtf_users.loc[:, :split-1]
print("non-null data:", dtf_train[dtf_train>0].count().sum())
dtf_train
# Test
dtf_test = dtf_users.loc[:, split:]
print("non-null data:", dtf_test[dtf_test>0].count().sum())
dtf_test

train = dtf_train.stack(dropna=True).reset_index().rename(columns={0:"y"})
test = dtf_test.stack(dropna=True).reset_index().rename(columns={0:"y"})

embeddings_size = 50
usr, prd = dtf_users.shape[0], dtf_users.shape[1]

# Input layer
xusers_in = layers.Input(name="xusers_in", shape=(1,))
xproducts_in = layers.Input(name="xproducts_in", shape=(1,))

# A) Matrix Factorization
## embeddings and reshape
cf_xusers_emb = layers.Embedding(name="cf_xusers_emb", input_dim=usr, output_dim=embeddings_size)(xusers_in)
cf_xusers = layers.Reshape(name='cf_xusers', target_shape=(embeddings_size,))(cf_xusers_emb)
## embeddings and reshape
cf_xproducts_emb = layers.Embedding(name="cf_xproducts_emb", input_dim=prd, output_dim=embeddings_size)(xproducts_in)
cf_xproducts = layers.Reshape(name='cf_xproducts', target_shape=(embeddings_size,))(cf_xproducts_emb)
## product
cf_xx = layers.Dot(name='cf_xx', normalize=True, axes=1)([cf_xusers, cf_xproducts])

# B) Neural Network
## embeddings and reshape
nn_xusers_emb = layers.Embedding(name="nn_xusers_emb", input_dim=usr, output_dim=embeddings_size)(xusers_in)
nn_xusers = layers.Reshape(name='nn_xusers', target_shape=(embeddings_size,))(nn_xusers_emb)
## embeddings and reshape
nn_xproducts_emb = layers.Embedding(name="nn_xproducts_emb", input_dim=prd, output_dim=embeddings_size)(xproducts_in)
nn_xproducts = layers.Reshape(name='nn_xproducts', target_shape=(embeddings_size,))(nn_xproducts_emb)
## concat and dense
nn_xx = layers.Concatenate()([nn_xusers, nn_xproducts])
nn_xx = layers.Dense(name="nn_xx", units=int(embeddings_size/2), activation='relu')(nn_xx)

# Merge A & B
y_out = layers.Concatenate()([cf_xx, nn_xx])
y_out = layers.Dense(name="y_out", units=1, activation='linear')(y_out)

# Compile
model = models.Model(inputs=[xusers_in,xproducts_in], outputs=y_out, name="Neural_CollaborativeFiltering")
model.compile(optimizer='adam', loss='mean_absolute_error', metrics=['mean_absolute_percentage_error'])
model.summary()

utils.plot_model(model, to_file='model.png', show_shapes=True, show_layer_names=True)

training = model.fit(x=[train["user"], train["product"]], y=train["y"],
                     epochs=100, batch_size=128, shuffle=True, verbose=0, validation_split=0.3)
model = training.model
utils_plot_keras_training(training)

test["yhat"] = model.predict([test["user"], test["product"]])

y_test = test[test["user"]==i].sort_values("y", ascending=False)["product"].values[:top]

return y_test
